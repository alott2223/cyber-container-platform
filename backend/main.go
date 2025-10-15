package main

import (
	"log"

	"cyber-container-platform/internal/api"
	"cyber-container-platform/internal/config"
	"cyber-container-platform/internal/docker"
	"cyber-container-platform/internal/database"
	"cyber-container-platform/internal/websocket"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Initialize database
	db, err := database.Init(cfg.DatabasePath)
	if err != nil {
		log.Fatal("Failed to initialize database:", err)
	}
	defer db.Close()

	// Initialize Docker client
	dockerClient, err := docker.NewClient()
	if err != nil {
		log.Fatal("Failed to initialize Docker client:", err)
	}

	// Initialize WebSocket hub
	wsHub := websocket.NewHub()
	go wsHub.Run()

	// Initialize API server
	server := api.NewServer(cfg, db, dockerClient, wsHub)

	// Start server
	log.Printf("Starting Cyber Container Platform on port %s", cfg.Port)
	if err := server.Start(); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
