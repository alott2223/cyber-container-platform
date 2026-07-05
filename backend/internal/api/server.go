package api

import (
	"log"
	"net/http"
	"time"

	"cyber-container-platform/internal/auth"
	"cyber-container-platform/internal/config"
	"cyber-container-platform/internal/crypto"
	"cyber-container-platform/internal/database"
	"cyber-container-platform/internal/docker"
	"cyber-container-platform/internal/logger"
	"cyber-container-platform/internal/middleware"
	"cyber-container-platform/internal/monitoring"
	"cyber-container-platform/internal/websocket"

	"github.com/gin-gonic/gin"
)

type Server struct {
	config       *config.Config
	db           *database.Database
	dockerClient *docker.Client
	wsHub        *websocket.Hub
	router       *gin.Engine
	logger       *logger.Logger
	metrics      *monitoring.Metrics
	loginLockout *auth.LoginLockout
	vault        *crypto.Vault
}

func NewServer(cfg *config.Config, db *database.Database, dockerClient *docker.Client, wsHub *websocket.Hub, vault *crypto.Vault) *Server {
	server := &Server{
		config:       cfg,
		db:           db,
		dockerClient: dockerClient,
		wsHub:        wsHub,
		logger:       logger.New("api", logger.INFO),
		metrics:      monitoring.GlobalMetrics,
		loginLockout: auth.NewLoginLockout(),
		vault:        vault,
	}

	server.setupRouter()
	return server
}

func (s *Server) setupRouter() {
	if s.config.IsProduction() {
		gin.SetMode(gin.ReleaseMode)
	}

	s.router = gin.Default()

	// Enterprise-level middleware stack
	s.router.Use(middleware.SecurityHeaders())
	s.router.Use(middleware.CORSMiddleware(s.config.AllowedOrigins))
	s.router.Use(middleware.RateLimiter(100, time.Minute))
	s.router.Use(middleware.InputSanitizer())
	s.router.Use(middleware.RequestLogger())

	// Error handling middleware
	s.router.Use(func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				s.logger.Error("Panic recovered", err.(error))
				s.metrics.RecordError("panic")
				c.JSON(http.StatusInternalServerError, gin.H{
					"error": "Internal server error",
					"code":  "INTERNAL_ERROR",
				})
				c.Abort()
			}
		}()
		c.Next()
	})

	// Static files
	s.router.Static("/static", "./static")

	// Health check endpoint
	s.router.GET("/health", s.healthCheck)
	s.router.GET("/api/v1/health", s.healthCheck)

	// Metrics endpoint (protected in production)
	if s.config.IsProduction() {
		s.router.GET("/metrics", s.authMiddleware(), s.getMetrics)
	} else {
		s.router.GET("/metrics", s.getMetrics)
	}

	// WebSocket endpoint
	s.router.GET("/ws", func(c *gin.Context) {
		s.wsHub.ServeWS(c.Writer, c.Request)
	})

	// API routes
	api := s.router.Group("/api/v1")
	{
		// Authentication
		authGroup := api.Group("/auth")
		{
			authGroup.POST("/login", middleware.RateLimiter(10, time.Minute), s.login)
			authGroup.POST("/register", s.register)
			authGroup.POST("/logout", s.authMiddleware(), s.logout)
			authGroup.POST("/change-password", s.authMiddleware(), s.changePassword)
			authGroup.GET("/profile", s.authMiddleware(), s.getProfile)
		}

		// Containers
		containers := api.Group("/containers")
		containers.Use(s.authMiddleware())
		{
			containers.GET("", s.listContainers)
			containers.POST("", s.createContainer)
			containers.GET("/:id", s.getContainer)
			containers.POST("/:id/start", s.startContainer)
			containers.POST("/:id/stop", s.stopContainer)
			containers.DELETE("/:id", s.removeContainer)
			containers.GET("/:id/logs", s.getContainerLogs)
			containers.GET("/:id/stats", s.getContainerStats)
			containers.POST("/:id/exec", s.execContainer)
		}

		// Networks
		networks := api.Group("/networks")
		networks.Use(s.authMiddleware())
		{
			networks.GET("", s.listNetworks)
			networks.POST("", s.createNetwork)
			networks.GET("/:id", s.getNetwork)
			networks.DELETE("/:id", s.removeNetwork)
		}

		// Volumes
		volumes := api.Group("/volumes")
		volumes.Use(s.authMiddleware())
		{
			volumes.GET("", s.listVolumes)
			volumes.POST("", s.createVolume)
			volumes.GET("/:name", s.getVolume)
			volumes.DELETE("/:name", s.removeVolume)
		}

		// Templates
		templates := api.Group("/templates")
		templates.Use(s.authMiddleware())
		{
			templates.GET("", s.listTemplates)
			templates.POST("", s.createTemplate)
			templates.GET("/:id", s.getTemplate)
			templates.PUT("/:id", s.updateTemplate)
			templates.DELETE("/:id", s.deleteTemplate)
		}

		// Images
		images := api.Group("/images")
		images.Use(s.authMiddleware())
		{
			images.GET("", s.listImages)
			images.POST("/pull", s.pullImage)
			images.DELETE("/:id", s.removeImage)
		}

		// System
		system := api.Group("/system")
		system.Use(s.authMiddleware())
		{
			system.GET("/info", s.getSystemInfo)
		}

		// OPSEC — operational security profiles and scripts
		opsecGroup := api.Group("/opsec")
		opsecGroup.Use(s.authMiddleware())
		{
			opsecGroup.GET("/profiles", s.listOPSECProfiles)
			opsecGroup.GET("/scripts", s.listOPSECScripts)
			opsecGroup.GET("/scripts/:id", s.getOPSECScript)
			opsecGroup.POST("/deploy", s.deployOPSECProfile)
			opsecGroup.GET("/encryption", s.getEncryptionInfo)
		}

		// Encrypted secrets vault (AES-256-GCM)
		secrets := api.Group("/secrets")
		secrets.Use(s.authMiddleware())
		{
			secrets.GET("", s.listSecrets)
			secrets.POST("", s.storeSecret)
			secrets.GET("/:name", s.getSecret)
			secrets.DELETE("/:name", s.deleteSecret)
		}
	}

	// Serve frontend (for production builds)
	s.router.NoRoute(func(c *gin.Context) {
		c.JSON(404, gin.H{"error": "Not found"})
	})
}

func (s *Server) healthCheck(c *gin.Context) {
	checks := map[string]string{
		"database": "healthy",
		"docker":   "healthy",
	}

	status := "healthy"
	statusCode := http.StatusOK

	if err := s.db.Ping(); err != nil {
		checks["database"] = "unhealthy"
		status = "unhealthy"
		statusCode = http.StatusServiceUnavailable
	}

	if s.dockerClient == nil {
		checks["docker"] = "unavailable"
		if status == "healthy" {
			status = "degraded"
		}
	} else if err := s.dockerClient.Ping(); err != nil {
		checks["docker"] = "unhealthy"
		if status == "healthy" {
			status = "degraded"
		}
		if statusCode == http.StatusOK {
			statusCode = http.StatusServiceUnavailable
		}
	}

	health := s.metrics.HealthCheck()
	health["status"] = status
	health["checks"] = checks

	c.JSON(statusCode, health)
}

func (s *Server) getMetrics(c *gin.Context) {
	stats := s.metrics.GetStats()
	c.JSON(http.StatusOK, stats)
}

func (s *Server) Start() error {
	// Start metrics collection goroutine
	go s.collectMetrics()

	if s.config.SSLEnabled {
		return s.router.RunTLS(":"+s.config.Port, s.config.CertPath, s.config.KeyPath)
	}
	return s.router.Run(":" + s.config.Port)
}

func (s *Server) collectMetrics() {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		containers, err := s.dockerClient.ListContainers()
		if err != nil {
			log.Printf("Failed to collect metrics: %v", err)
			continue
		}

		s.wsHub.Broadcast(websocket.Message{
			Type: "metrics_update",
			Data: containers,
		})
	}
}
