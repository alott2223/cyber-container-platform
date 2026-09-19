package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	"cyber-container-platform/internal/auth"
)

const (
	EnvDevelopment = "development"
	EnvProduction  = "production"
)

type Config struct {
	Port              string
	WSPort            string
	DatabasePath      string
	JWTSecret         string
	JWTExpiry         time.Duration
	SSLEnabled        bool
	CertPath          string
	KeyPath           string
	LogLevel          string
	Environment       string
	AdminUsername     string
	AdminPassword     string
	AllowRegistration bool
	AllowedOrigins    []string
	BcryptCost        int
	MaxLoginAttempts  int
	LockoutDuration   time.Duration
}

func Load() *Config {
	jwtExpiry := parseDuration(getEnv("JWT_EXPIRY", "24h"), 24*time.Hour)
	lockoutDuration := parseDuration(getEnv("LOCKOUT_DURATION", "15m"), 15*time.Minute)

	cfg := &Config{
		Port:              getEnv("PORT", "8080"),
		WSPort:            getEnv("WS_PORT", "8081"),
		DatabasePath:      getEnv("DATABASE_PATH", "./data/cyber.db"),
		JWTSecret:         getEnv("JWT_SECRET", "cyber-secret-key-change-in-production"),
		JWTExpiry:         jwtExpiry,
		SSLEnabled:        getBoolEnv("SSL_ENABLED", false),
		CertPath:          getEnv("CERT_PATH", "./certs/server.crt"),
		KeyPath:           getEnv("KEY_PATH", "./certs/server.key"),
		LogLevel:          getEnv("LOG_LEVEL", "info"),
		Environment:       getEnv("ENVIRONMENT", EnvDevelopment),
		AdminUsername:     getEnv("ADMIN_USERNAME", "admin"),
		AdminPassword:     getEnv("ADMIN_PASSWORD", ""),
		AllowRegistration: getBoolEnv("ALLOW_REGISTRATION", false),
		AllowedOrigins:    parseCSV(getEnv("ALLOWED_ORIGINS", "http://localhost:3000,https://localhost:3000")),
		BcryptCost:        getIntEnv("BCRYPT_COST", auth.DefaultBcryptCost),
		MaxLoginAttempts:  getIntEnv("MAX_LOGIN_ATTEMPTS", 5),
		LockoutDuration:   lockoutDuration,
	}

	return cfg
}

func (c *Config) Validate() error {
	if c.Environment == EnvProduction {
		if auth.IsDefaultJWTSecret(c.JWTSecret) {
			return fmt.Errorf("JWT_SECRET must be set to a secure value in production")
		}
		if len(c.JWTSecret) < 32 {
			return fmt.Errorf("JWT_SECRET must be at least 32 characters in production")
		}
		if c.AdminPassword == "" {
			return fmt.Errorf("ADMIN_PASSWORD must be set in production")
		}
		if err := auth.ValidatePassword(c.AdminPassword); err != nil {
			return fmt.Errorf("ADMIN_PASSWORD does not meet security requirements: %w", err)
		}
	}

	if c.AdminPassword != "" {
		if err := auth.ValidatePassword(c.AdminPassword); err != nil {
			return fmt.Errorf("ADMIN_PASSWORD does not meet security requirements: %w", err)
		}
	}

	return nil
}

func (c *Config) IsProduction() bool {
	return c.Environment == EnvProduction
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getBoolEnv(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		if parsed, err := strconv.ParseBool(value); err == nil {
			return parsed
		}
	}
	return defaultValue
}

func getIntEnv(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if parsed, err := strconv.Atoi(value); err == nil {
			return parsed
		}
	}
	return defaultValue
}

func parseDuration(value string, defaultValue time.Duration) time.Duration {
	if parsed, err := time.ParseDuration(value); err == nil {
		return parsed
	}
	return defaultValue
}

func parseCSV(value string) []string {
	parts := strings.Split(value, ",")
	origins := make([]string, 0, len(parts))
	for _, part := range parts {
		trimmed := strings.TrimSpace(part)
		if trimmed != "" {
			origins = append(origins, trimmed)
		}
	}
	return origins
}
