package api

import (
	"log"
	"net/http"
	"time"

	"cyber-container-platform/internal/config"
	"cyber-container-platform/internal/database"
	"cyber-container-platform/internal/docker"
	"cyber-container-platform/internal/websocket"
	"cyber-container-platform/internal/middleware"
	"cyber-container-platform/internal/monitoring"
	"cyber-container-platform/internal/logger"

	"github.com/gin-contrib/cors"
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
}

func NewServer(cfg *config.Config, db *database.Database, dockerClient *docker.Client, wsHub *websocket.Hub) *Server {
	server := &Server{
		config:       cfg,
		db:           db,
		dockerClient: dockerClient,
		wsHub:        wsHub,
		logger:       logger.New("api", logger.INFO),
		metrics:      monitoring.GlobalMetrics,
	}

	server.setupRouter()
	return server
}

func (s *Server) setupRouter() {
	if s.config.SSLEnabled {
		gin.SetMode(gin.ReleaseMode)
	}

	s.router = gin.Default()

	// Enterprise-level middleware stack
	s.router.Use(middleware.SecurityHeaders())
	s.router.Use(middleware.CORSMiddleware())
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

	// CORS configuration
	s.router.Use(cors.New(cors.Config{
		AllowAllOrigins:  true, // Allow all origins for development
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Static files
	s.router.Static("/static", "./static")

	// Health check endpoint
	s.router.GET("/health", func(c *gin.Context) {
		health := s.metrics.HealthCheck()
		c.JSON(http.StatusOK, health)
	})

	// Metrics endpoint
	s.router.GET("/metrics", func(c *gin.Context) {
		stats := s.metrics.GetStats()
		c.JSON(http.StatusOK, stats)
	})

	// WebSocket endpoint
	s.router.GET("/ws", func(c *gin.Context) {
		s.wsHub.ServeWS(c.Writer, c.Request)
	})

	// API routes
	api := s.router.Group("/api/v1")
	{
		// Authentication
		auth := api.Group("/auth")
		{
			auth.POST("/login", s.login)
			auth.POST("/register", s.register)
			auth.POST("/logout", s.logout)
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
		}
	}

	// Serve frontend (for production builds)
	s.router.NoRoute(func(c *gin.Context) {
		c.JSON(404, gin.H{"error": "Not found"})
	})
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

	for {
		select {
		case <-ticker.C:
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
}
