package main

import (
	"crypto/rand"
	"fmt"
	"log"
	"os"

	"cyber-container-platform/internal/api"
	"cyber-container-platform/internal/auth"
	"cyber-container-platform/internal/config"
	"cyber-container-platform/internal/database"
	"cyber-container-platform/internal/docker"
	"cyber-container-platform/internal/websocket"
)

func main() {
	cfg := config.Load()

	if err := cfg.Validate(); err != nil {
		log.Fatal("Configuration validation failed:", err)
	}

	db, err := database.Init(cfg.DatabasePath)
	if err != nil {
		log.Fatal("Failed to initialize database:", err)
	}
	defer db.Close()

	if err := bootstrapAdmin(db, cfg); err != nil {
		log.Fatal("Failed to bootstrap admin user:", err)
	}

	dockerClient, err := docker.NewClient()
	if err != nil {
		log.Fatal("Failed to initialize Docker client:", err)
	}

	wsHub := websocket.NewHub()
	go wsHub.Run()

	server := api.NewServer(cfg, db, dockerClient, wsHub)

	log.Printf("Starting Cyber Container Platform on port %s (environment: %s)", cfg.Port, cfg.Environment)
	if err := server.Start(); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}

func bootstrapAdmin(db *database.Database, cfg *config.Config) error {
	count, err := db.CountUsers()
	if err != nil {
		return err
	}

	if count > 0 {
		return nil
	}

	adminPassword := cfg.AdminPassword
	mustChangePassword := false

	if adminPassword == "" {
		if cfg.IsProduction() {
			return fmt.Errorf("no users exist and ADMIN_PASSWORD is not set")
		}

		generated, err := generateSecurePassword(16)
		if err != nil {
			return fmt.Errorf("failed to generate admin password: %w", err)
		}
		adminPassword = generated
		mustChangePassword = true

		log.Println("============================================================")
		log.Println("  FIRST RUN: Admin account created")
		log.Printf("  Username: %s", cfg.AdminUsername)
		log.Printf("  Password: %s", adminPassword)
		log.Println("  Save these credentials and change the password after login.")
		log.Println("============================================================")
	}

	hashedPassword, err := auth.HashPassword(adminPassword, cfg.BcryptCost)
	if err != nil {
		return err
	}

	_, err = db.CreateUser(cfg.AdminUsername, hashedPassword, "", "admin", mustChangePassword)
	if err != nil {
		return err
	}

	_ = db.LogAuditEvent(nil, cfg.AdminUsername, "bootstrap", "auth", "Admin account created", "system", true)
	return nil
}

func generateSecurePassword(length int) (string, error) {
	if length < 12 {
		length = 12
	}

	upper := "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
	lower := "abcdefghijklmnopqrstuvwxyz"
	digits := "0123456789"
	special := "!@#$%^&*"
	all := upper + lower + digits + special

	password := make([]byte, length)
	requiredSets := []string{upper, lower, digits, special}

	for i, set := range requiredSets {
		b := make([]byte, 1)
		if _, err := rand.Read(b); err != nil {
			return "", err
		}
		password[i] = set[int(b[0])%len(set)]
	}

	for i := len(requiredSets); i < length; i++ {
		b := make([]byte, 1)
		if _, err := rand.Read(b); err != nil {
			return "", err
		}
		password[i] = all[int(b[0])%len(all)]
	}

	// Fisher-Yates shuffle
	for i := len(password) - 1; i > 0; i-- {
		b := make([]byte, 1)
		if _, err := rand.Read(b); err != nil {
			return "", err
		}
		j := int(b[0]) % (i + 1)
		password[i], password[j] = password[j], password[i]
	}

	return string(password), nil
}

func init() {
	if os.Getenv("GIN_MODE") == "" && os.Getenv("ENVIRONMENT") == config.EnvProduction {
		os.Setenv("GIN_MODE", "release")
	}
}
