package api

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"testing"

	"cyber-container-platform/internal/auth"
	"cyber-container-platform/internal/config"
	"cyber-container-platform/internal/database"
	"cyber-container-platform/internal/monitoring"
	"cyber-container-platform/internal/websocket"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func setupTestServer(t *testing.T) *Server {
	t.Helper()
	gin.SetMode(gin.TestMode)

	tmpDir := t.TempDir()
	dbPath := filepath.Join(tmpDir, "test.db")

	db, err := database.Init(dbPath)
	require.NoError(t, err)
	t.Cleanup(func() { db.Close() })

	cfg := &config.Config{
		Port:              "8080",
		JWTSecret:         "test-jwt-secret-key-for-unit-tests-only",
		JWTExpiry:         config.Load().JWTExpiry,
		Environment:       config.EnvDevelopment,
		AdminUsername:     "admin",
		AdminPassword:     "TestAdmin123!",
		AllowRegistration: false,
		AllowedOrigins:    []string{"http://localhost:3000"},
		BcryptCost:        4,
		MaxLoginAttempts:  5,
		LockoutDuration:   config.Load().LockoutDuration,
	}

	server := &Server{
		config:       cfg,
		db:           db,
		dockerClient: nil,
		wsHub:        websocket.NewHub(),
		metrics:      monitoring.GlobalMetrics,
		loginLockout: auth.NewLoginLockout(),
	}
	server.setupRouter()

	return server
}

func TestHealthEndpoint(t *testing.T) {
	server := setupTestServer(t)

	req, _ := http.NewRequest("GET", "/health", nil)
	w := httptest.NewRecorder()
	server.router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "degraded", response["status"])
}

func TestCreateContainerValidation(t *testing.T) {
	server := setupTestServer(t)

	reqBody := map[string]interface{}{
		"name":  "",
		"image": "nginx:alpine",
	}

	jsonBody, _ := json.Marshal(reqBody)
	req, _ := http.NewRequest("POST", "/api/v1/containers", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer invalid-token")

	w := httptest.NewRecorder()
	server.router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestLoginWithInvalidCredentials(t *testing.T) {
	server := setupTestServer(t)

	// Create admin user for login test
	hashed, err := auth.HashPassword("TestAdmin123!", 4)
	require.NoError(t, err)
	_, err = server.db.CreateUser("admin", hashed, "", "admin", false)
	require.NoError(t, err)

	reqBody := map[string]string{
		"username": "admin",
		"password": "wrong-password",
	}
	jsonBody, _ := json.Marshal(reqBody)

	req, _ := http.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	server.router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestRegistrationDisabledByDefault(t *testing.T) {
	server := setupTestServer(t)

	reqBody := map[string]string{
		"username": "newuser",
		"password": "SecurePass123!",
	}
	jsonBody, _ := json.Marshal(reqBody)

	req, _ := http.NewRequest("POST", "/api/v1/auth/register", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	server.router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusForbidden, w.Code)
}

func TestValidationHelpers(t *testing.T) {
	assert.True(t, isValidContainerName("valid-container"))
	assert.True(t, isValidContainerName("valid_container"))
	assert.True(t, isValidContainerName("valid123"))
	assert.False(t, isValidContainerName(""))
	assert.False(t, isValidContainerName("invalid-container-name-that-is-way-too-long-and-exceeds-the-maximum-length-allowed"))
	assert.False(t, isValidContainerName("-invalid"))
	assert.False(t, isValidContainerName("invalid-"))

	assert.True(t, isValidImageName("nginx:alpine"))
	assert.True(t, isValidImageName("redis"))
	assert.False(t, isValidImageName(""))
	assert.False(t, isValidImageName("image/with/../path"))
	assert.False(t, isValidImageName("image|with|pipes"))

	assert.Equal(t, "clean", sanitizeString("clean"))
	assert.Equal(t, "clean", sanitizeString("  clean  "))
	assert.Equal(t, "clean", sanitizeString("clean\r\n\t"))
	assert.Equal(t, "clean", sanitizeString("clean\x00"))
}
