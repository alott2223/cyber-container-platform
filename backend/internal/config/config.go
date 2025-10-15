package config

import (
	"os"
	"strconv"
)

type Config struct {
	Port         string
	WSPort       string
	DatabasePath string
	JWTSecret    string
	SSLEnabled   bool
	CertPath     string
	KeyPath      string
}

func Load() *Config {
	return &Config{
		Port:         getEnv("PORT", "8080"),
		WSPort:       getEnv("WS_PORT", "8081"),
		DatabasePath: getEnv("DATABASE_PATH", "./data/cyber.db"),
		JWTSecret:    getEnv("JWT_SECRET", "cyber-secret-key-change-in-production"),
		SSLEnabled:   getBoolEnv("SSL_ENABLED", false),
		CertPath:     getEnv("CERT_PATH", "./certs/server.crt"),
		KeyPath:      getEnv("KEY_PATH", "./certs/server.key"),
	}
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
