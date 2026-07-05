package api

import (
	"database/sql"
	"fmt"
	"net/http"
	"strings"

	"cyber-container-platform/internal/opsec"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/go-connections/nat"
	"github.com/gin-gonic/gin"
)

type StoreSecretRequest struct {
	Name     string `json:"name" binding:"required"`
	Value    string `json:"value" binding:"required"`
	Category string `json:"category"`
}

type DeployOPSECRequest struct {
	ProfileID string `json:"profile_id" binding:"required"`
	Name      string `json:"name" binding:"required"`
}

func (s *Server) listOPSECProfiles(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"profiles":      opsec.Profiles,
		"security_levels": []string{"standard", "hardened", "maximum", "airgap"},
	})
}

func (s *Server) listOPSECScripts(c *gin.Context) {
	scripts := make([]gin.H, 0, len(opsec.Scripts))
	for _, script := range opsec.Scripts {
		entry := gin.H{
			"id":          script.ID,
			"name":        script.Name,
			"description": script.Description,
			"category":    script.Category,
			"filename":    script.Filename,
			"tags":        script.Tags,
		}
		if content, err := opsec.ReadScriptContent(script.ID); err == nil {
			entry["preview"] = truncateString(content, 500)
			entry["size_bytes"] = len(content)
		}
		scripts = append(scripts, entry)
	}
	c.JSON(http.StatusOK, gin.H{"scripts": scripts, "count": len(scripts)})
}

func (s *Server) getOPSECScript(c *gin.Context) {
	id := c.Param("id")
	content, err := opsec.ReadScriptContent(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Script not found"})
		return
	}
	script := opsec.GetScript(id)
	c.JSON(http.StatusOK, gin.H{
		"script":  script,
		"content": content,
	})
}

func (s *Server) deployOPSECProfile(c *gin.Context) {
	var req DeployOPSECRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	profile := opsec.GetProfile(req.ProfileID)
	if profile == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "OPSEC profile not found"})
		return
	}

	if !isValidContainerName(req.Name) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid container name"})
		return
	}

	config := &container.Config{
		Image: profile.Image,
		Env:   envMapToSlice(profile.Environment),
		Cmd:   profile.Command,
		Labels: map[string]string{
			"cyber.opsec.profile":   profile.ID,
			"cyber.opsec.level":     string(profile.SecurityLevel),
			"cyber.opsec.encrypted": "true",
		},
	}

	hostConfig := &container.HostConfig{}
	opsec.ApplySecurityProfile(hostConfig, profile.SecurityLevel, profile)

	// Mount OPSEC scripts
	binds := opsec.ScriptMountBinds()
	if len(profile.Volumes) > 0 {
		binds = append(binds, profile.Volumes...)
	}
	if len(binds) > 0 {
		hostConfig.Binds = binds
	}

	// Port bindings
	if len(profile.Ports) > 0 {
		addPortBindings(config, hostConfig, profile.Ports)
	}

	containerID, err := s.dockerClient.CreateContainer(config, hostConfig, nil, req.Name)
	if err != nil {
		if isMissingImageError(err) {
			if pullErr := s.dockerClient.EnsureImage(profile.Image); pullErr != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to pull image %s: %v", profile.Image, pullErr)})
				return
			}
			containerID, err = s.dockerClient.CreateContainer(config, hostConfig, nil, req.Name)
		}
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	if err := s.dockerClient.StartContainer(containerID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Created but failed to start: %v", err)})
		return
	}

	username, _ := c.Get("username")
	_ = s.db.LogAuditEvent(nil, fmt.Sprintf("%v", username), "opsec_deploy", profile.ID,
		fmt.Sprintf("Deployed OPSEC container %s", req.Name), c.ClientIP(), true)

	c.JSON(http.StatusCreated, gin.H{
		"id":             containerID,
		"name":           req.Name,
		"profile":        profile.ID,
		"security_level": profile.SecurityLevel,
		"scripts":        profile.Scripts,
		"message":        "OPSEC container deployed successfully",
	})
}

func (s *Server) storeSecret(c *gin.Context) {
	if s.vault == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Encryption vault not configured"})
		return
	}

	var req StoreSecretRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, ok := c.Get("user_id")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	encrypted, err := s.vault.Encrypt([]byte(req.Value))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Encryption failed"})
		return
	}

	category := req.Category
	if category == "" {
		category = "general"
	}

	secret, err := s.db.StoreSecret(req.Name, encrypted, category, userID.(int64))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to store secret"})
		return
	}

	username, _ := c.Get("username")
	_ = s.db.LogAuditEvent(&secret.CreatedBy, fmt.Sprintf("%v", username), "secret_store", req.Name, "Secret encrypted and stored", c.ClientIP(), true)

	c.JSON(http.StatusCreated, gin.H{
		"name":     secret.Name,
		"category": secret.Category,
		"message":  "Secret encrypted with AES-256-GCM and stored",
	})
}

func (s *Server) listSecrets(c *gin.Context) {
	userID, ok := c.Get("user_id")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	secrets, err := s.db.ListSecrets(userID.(int64))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list secrets"})
		return
	}

	// Never return encrypted values in list
	safe := make([]gin.H, 0, len(secrets))
	for _, sec := range secrets {
		safe = append(safe, gin.H{
			"name":       sec.Name,
			"category":   sec.Category,
			"created_at": sec.CreatedAt,
			"updated_at": sec.UpdatedAt,
		})
	}
	c.JSON(http.StatusOK, gin.H{"secrets": safe, "encryption": "AES-256-GCM"})
}

func (s *Server) getSecret(c *gin.Context) {
	if s.vault == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Encryption vault not configured"})
		return
	}

	name := c.Param("name")
	userID, _ := c.Get("user_id")

	secret, err := s.db.GetSecretByName(name)
	if err != nil || secret == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Secret not found"})
		return
	}

	if secret.CreatedBy != userID.(int64) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden"})
		return
	}

	plaintext, err := s.vault.Decrypt(secret.Value)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Decryption failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"name":       secret.Name,
		"value":      string(plaintext),
		"category":   secret.Category,
		"encryption": "AES-256-GCM",
	})
}

func (s *Server) deleteSecret(c *gin.Context) {
	name := c.Param("name")
	userID, _ := c.Get("user_id")

	if err := s.db.DeleteSecret(name, userID.(int64)); err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Secret not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete secret"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Secret securely deleted"})
}

func (s *Server) getEncryptionInfo(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"algorithm":        "AES-256-GCM",
		"key_derivation":   "SHA-256",
		"authentication":   "GCM authenticated encryption",
		"compliance":       []string{"FIPS 140-2 aligned", "NIST SP 800-38D", "NSA Suite B"},
		"features": []string{
			"Authenticated encryption with associated data",
			"256-bit key strength",
			"Unique nonce per encryption operation",
			"Tamper detection on decryption",
			"Secure memory zeroing",
			"Envelope encryption support",
		},
		"container_security": []string{
			"Capability dropping (CAP_DROP ALL)",
			"Seccomp default profile",
			"AppArmor confinement",
			"No new privileges",
			"Read-only root filesystem",
			"Network airgap mode",
			"Tmpfs with noexec/nosuid",
		},
	})
}

func envMapToSlice(env map[string]string) []string {
	if env == nil {
		return nil
	}
	result := make([]string, 0, len(env))
	for k, v := range env {
		result = append(result, k+"="+v)
	}
	return result
}

func truncateString(s string, max int) string {
	if len(s) <= max {
		return s
	}
	return s[:max] + "\n... (truncated)"
}

func isMissingImageError(err error) bool {
	if err == nil {
		return false
	}
	msg := strings.ToLower(err.Error())
	return strings.Contains(msg, "no such image") || strings.Contains(msg, "unable to find image")
}

func addPortBindings(config *container.Config, hostConfig *container.HostConfig, ports map[string]string) {
	if len(ports) == 0 {
		return
	}
	portBindings := make(nat.PortMap)
	exposedPorts := make(nat.PortSet)
	for hostPort, containerPort := range ports {
		portSpec := containerPort
		if !strings.Contains(portSpec, "/") {
			portSpec = portSpec + "/tcp"
		}
		portBindings[nat.Port(portSpec)] = []nat.PortBinding{{HostPort: strings.Split(hostPort, "/")[0]}}
		exposedPorts[nat.Port(portSpec)] = struct{}{}
	}
	hostConfig.PortBindings = portBindings
	config.ExposedPorts = exposedPorts
}
