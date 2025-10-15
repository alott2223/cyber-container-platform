package api

import (
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/go-connections/nat"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type RegisterRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
	Email    string `json:"email"`
}

type CreateContainerRequest struct {
	Name        string            `json:"name" binding:"required"`
	Image       string            `json:"image" binding:"required"`
	Ports       map[string]string `json:"ports"`
	Environment map[string]string `json:"environment"`
	Volumes     map[string]string `json:"volumes"`
	Network     string            `json:"network"`
}

type CreateNetworkRequest struct {
	Name   string `json:"name" binding:"required"`
	Driver string `json:"driver"`
}

type CreateVolumeRequest struct {
	Name   string `json:"name" binding:"required"`
	Driver string `json:"driver"`
}

type CreateTemplateRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	Image       string `json:"image" binding:"required"`
	Config      string `json:"config" binding:"required"`
}

func (s *Server) login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Simple authentication - in production, use proper user management
	if req.Username == "admin" && req.Password == "admin" {
		token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
			"username": req.Username,
			"exp":      time.Now().Add(time.Hour * 24).Unix(),
		})

		tokenString, err := token.SignedString([]byte(s.config.JWTSecret))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"token": tokenString})
		return
	}

	c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
}

func (s *Server) register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Insert user into database
	_, err = s.db.GetDB().Exec(
		"INSERT INTO users (username, password_hash, email) VALUES (?, ?, ?)",
		req.Username, string(hashedPassword), req.Email,
	)
	if err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Username already exists"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "User created successfully"})
}

func (s *Server) logout(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}

func (s *Server) listContainers(c *gin.Context) {
	containers, err := s.dockerClient.ListContainers()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"containers": containers})
}

func (s *Server) createContainer(c *gin.Context) {
	var req CreateContainerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	// Input validation
	if req.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Container name is required"})
		return
	}
	if req.Image == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Container image is required"})
		return
	}

	// Sanitize inputs
	req.Name = strings.TrimSpace(req.Name)
	req.Image = strings.TrimSpace(req.Image)
	
	// Validate container name format
	if !isValidContainerName(req.Name) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid container name format"})
		return
	}

	// Validate image name
	if !isValidImageName(req.Image) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid image name format"})
		return
	}

	// Convert environment map to slice
	var env []string
	for key, value := range req.Environment {
		env = append(env, key+"="+value)
	}

	// Create container config
	config := &container.Config{
		Image: req.Image,
		Env:   env,
	}

	// Create host config
	hostConfig := &container.HostConfig{}

	// Add port bindings
	if len(req.Ports) > 0 {
		portBindings := make(nat.PortMap)
		exposedPorts := make(nat.PortSet)

		for hostPort, containerPort := range req.Ports {
			portBindings[nat.Port(containerPort+"/tcp")] = []nat.PortBinding{
				{HostPort: hostPort},
			}
			exposedPorts[nat.Port(containerPort+"/tcp")] = struct{}{}
		}

		hostConfig.PortBindings = portBindings
		config.ExposedPorts = exposedPorts
	}

	// Add volume mounts
	if len(req.Volumes) > 0 {
		var binds []string
		for hostPath, containerPath := range req.Volumes {
			binds = append(binds, hostPath+":"+containerPath)
		}
		hostConfig.Binds = binds
	}

	containerID, err := s.dockerClient.CreateContainer(config, hostConfig, nil, req.Name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"id": containerID, "message": "Container created successfully"})
}

func (s *Server) getContainer(c *gin.Context) {
	id := c.Param("id")
	containers, err := s.dockerClient.ListContainers()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	for _, container := range containers {
		if container.ID == id {
			c.JSON(http.StatusOK, gin.H{"container": container})
			return
		}
	}

	c.JSON(http.StatusNotFound, gin.H{"error": "Container not found"})
}

func (s *Server) startContainer(c *gin.Context) {
	id := c.Param("id")
	err := s.dockerClient.StartContainer(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Container started successfully"})
}

func (s *Server) stopContainer(c *gin.Context) {
	id := c.Param("id")
	err := s.dockerClient.StopContainer(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Container stopped successfully"})
}

func (s *Server) removeContainer(c *gin.Context) {
	id := c.Param("id")
	err := s.dockerClient.RemoveContainer(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Container removed successfully"})
}

func (s *Server) getContainerLogs(c *gin.Context) {
	id := c.Param("id")
	logs, err := s.dockerClient.GetContainerLogs(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer logs.Close()

	c.Header("Content-Type", "text/plain")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")

	c.Stream(func(w io.Writer) bool {
		buffer := make([]byte, 1024)
		n, err := logs.Read(buffer)
		if err != nil {
			return false
		}
		w.Write(buffer[:n])
		return true
	})
}

func (s *Server) getContainerStats(c *gin.Context) {
	id := c.Param("id")
	stats, err := s.dockerClient.GetContainerStats(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"stats": stats})
}

func (s *Server) listNetworks(c *gin.Context) {
	networks, err := s.dockerClient.ListNetworks()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"networks": networks})
}

func (s *Server) createNetwork(c *gin.Context) {
	var req CreateNetworkRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Driver == "" {
		req.Driver = "bridge"
	}

	networkID, err := s.dockerClient.CreateNetwork(req.Name, req.Driver)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"id": networkID, "message": "Network created successfully"})
}

func (s *Server) getNetwork(c *gin.Context) {
	id := c.Param("id")
	networks, err := s.dockerClient.ListNetworks()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	for _, network := range networks {
		if network.ID == id {
			c.JSON(http.StatusOK, gin.H{"network": network})
			return
		}
	}

	c.JSON(http.StatusNotFound, gin.H{"error": "Network not found"})
}

func (s *Server) removeNetwork(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Network ID is required"})
		return
	}

	err := s.dockerClient.RemoveNetwork(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Network removed successfully"})
}

func (s *Server) listVolumes(c *gin.Context) {
	volumes, err := s.dockerClient.ListVolumes()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"volumes": volumes})
}

func (s *Server) createVolume(c *gin.Context) {
	var req CreateVolumeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	vol, err := s.dockerClient.CreateVolume(req.Name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"volume": vol, "message": "Volume created successfully"})
}

func (s *Server) getVolume(c *gin.Context) {
	name := c.Param("name")
	volumes, err := s.dockerClient.ListVolumes()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	for _, volume := range volumes {
		if volume.Name == name {
			c.JSON(http.StatusOK, gin.H{"volume": volume})
			return
		}
	}

	c.JSON(http.StatusNotFound, gin.H{"error": "Volume not found"})
}

func (s *Server) removeVolume(c *gin.Context) {
	name := c.Param("name")
	if name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Volume name is required"})
		return
	}

	err := s.dockerClient.RemoveVolume(name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Volume removed successfully"})
}

func (s *Server) listTemplates(c *gin.Context) {
	rows, err := s.db.GetDB().Query("SELECT id, name, description, image, config, created_at FROM container_templates ORDER BY created_at DESC")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var templates []map[string]interface{}
	for rows.Next() {
		var id int
		var name, description, image, config string
		var createdAt time.Time

		err := rows.Scan(&id, &name, &description, &image, &config, &createdAt)
		if err != nil {
			continue
		}

		templates = append(templates, map[string]interface{}{
			"id":          id,
			"name":        name,
			"description": description,
			"image":       image,
			"config":      config,
			"created_at":  createdAt,
		})
	}

	c.JSON(http.StatusOK, gin.H{"templates": templates})
}

func (s *Server) createTemplate(c *gin.Context) {
	var req CreateTemplateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := s.db.GetDB().Exec(
		"INSERT INTO container_templates (name, description, image, config) VALUES (?, ?, ?, ?)",
		req.Name, req.Description, req.Image, req.Config,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	id, _ := result.LastInsertId()
	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "Template created successfully"})
}

func (s *Server) getTemplate(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid template ID"})
		return
	}

	var name, description, image, config string
	var createdAt time.Time

	err = s.db.GetDB().QueryRow(
		"SELECT name, description, image, config, created_at FROM container_templates WHERE id = ?",
		id,
	).Scan(&name, &description, &image, &config, &createdAt)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Template not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"template": map[string]interface{}{
			"id":          id,
			"name":        name,
			"description": description,
			"image":       image,
			"config":      config,
			"created_at":  createdAt,
		},
	})
}

func (s *Server) updateTemplate(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid template ID"})
		return
	}

	var req CreateTemplateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_, err = s.db.GetDB().Exec(
		"UPDATE container_templates SET name = ?, description = ?, image = ?, config = ? WHERE id = ?",
		req.Name, req.Description, req.Image, req.Config, id,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Template updated successfully"})
}

func (s *Server) deleteTemplate(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid template ID"})
		return
	}

	_, err = s.db.GetDB().Exec("DELETE FROM container_templates WHERE id = ?", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Template deleted successfully"})
}

// Validation helper functions
func isValidContainerName(name string) bool {
	// Docker container name validation: alphanumeric, hyphens, underscores, 1-63 chars
	if len(name) < 1 || len(name) > 63 {
		return false
	}
	
	// Must start and end with alphanumeric
	if !isAlphanumeric(name[0]) || !isAlphanumeric(name[len(name)-1]) {
		return false
	}
	
	// Can contain alphanumeric, hyphens, underscores
	for _, char := range name {
		if !isAlphanumeric(char) && char != '-' && char != '_' {
			return false
		}
	}
	
	return true
}

func isAlphanumeric(char rune) bool {
	return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || (char >= '0' && char <= '9')
}

func isValidImageName(image string) bool {
	// Basic image name validation
	if len(image) < 1 || len(image) > 255 {
		return false
	}
	
	// Should not contain dangerous characters
	dangerousChars := []string{"..", "//", "\\", "<", ">", "|", "&", "`", "$", ";", "(", ")"}
	for _, char := range dangerousChars {
		if strings.Contains(image, char) {
			return false
		}
	}
	
	return true
}

func sanitizeString(input string) string {
	// Remove potentially dangerous characters
	input = strings.TrimSpace(input)
	input = strings.ReplaceAll(input, "\r", "")
	input = strings.ReplaceAll(input, "\n", "")
	input = strings.ReplaceAll(input, "\t", "")
	input = strings.ReplaceAll(input, "\x00", "") // Remove null bytes
	return input
}

func (s *Server) authMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString := c.GetHeader("Authorization")
		if tokenString == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		if len(tokenString) > 7 && tokenString[:7] == "Bearer " {
			tokenString = tokenString[7:]
		}

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return []byte(s.config.JWTSecret), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		c.Next()
	}
}
