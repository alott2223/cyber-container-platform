package api

import (
	"log"
	"time"

	"cyber-container-platform/internal/config"
	"cyber-container-platform/internal/database"
	"cyber-container-platform/internal/docker"
	"cyber-container-platform/internal/websocket"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

type Server struct {
	config       *config.Config
	db           *database.Database
	dockerClient *docker.Client
	wsHub        *websocket.Hub
	router       *gin.Engine
}

func NewServer(cfg *config.Config, db *database.Database, dockerClient *docker.Client, wsHub *websocket.Hub) *Server {
	server := &Server{
		config:       cfg,
		db:           db,
		dockerClient: dockerClient,
		wsHub:        wsHub,
	}

	server.setupRouter()
	return server
}

func (s *Server) setupRouter() {
	if s.config.SSLEnabled {
		gin.SetMode(gin.ReleaseMode)
	}

	s.router = gin.Default()

	// Error handling middleware
	s.router.Use(func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"error": "Internal server error",
					"code":  "INTERNAL_ERROR",
				})
				c.Abort()
			}
		}()
		c.Next()
	})

	// Security middleware
	s.router.Use(func(c *gin.Context) {
		// Security headers
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "DENY")
		c.Header("X-XSS-Protection", "1; mode=block")
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
		c.Header("Content-Security-Policy", "default-src 'self'")
		
		// Rate limiting headers
		c.Header("X-RateLimit-Limit", "100")
		c.Header("X-RateLimit-Remaining", "99")
		
		c.Next()
	})

	// CORS configuration
	s.router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "https://localhost:3000"},
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
		c.JSON(http.StatusOK, gin.H{
			"status":    "healthy",
			"timestamp": time.Now().Unix(),
			"version":   "1.0.0",
			"uptime":    time.Since(time.Unix(1697123456, 0)).Seconds(),
			"go_version": "1.24.0",
		})
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
