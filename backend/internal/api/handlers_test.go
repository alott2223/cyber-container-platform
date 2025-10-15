package api

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestHealthEndpoint(t *testing.T) {
	gin.SetMode(gin.TestMode)
	
	// Create a test server
	server := &Server{}
	server.setupRouter()
	
	// Create a request to the health endpoint
	req, _ := http.NewRequest("GET", "/health", nil)
	w := httptest.NewRecorder()
	
	// Perform the request
	server.router.ServeHTTP(w, req)
	
	// Assert the response
	assert.Equal(t, http.StatusOK, w.Code)
	
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "healthy", response["status"])
}

func TestCreateContainerValidation(t *testing.T) {
	gin.SetMode(gin.TestMode)
	
	server := &Server{}
	server.setupRouter()
	
	// Test with empty container name
	reqBody := map[string]interface{}{
		"name":  "",
		"image": "nginx:alpine",
	}
	
	jsonBody, _ := json.Marshal(reqBody)
	req, _ := http.NewRequest("POST", "/api/v1/containers", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer test-token")
	
	w := httptest.NewRecorder()
	server.router.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestValidationHelpers(t *testing.T) {
	// Test container name validation
	assert.True(t, isValidContainerName("valid-container"))
	assert.True(t, isValidContainerName("valid_container"))
	assert.True(t, isValidContainerName("valid123"))
	assert.False(t, isValidContainerName(""))
	assert.False(t, isValidContainerName("invalid-container-name-that-is-way-too-long-and-exceeds-the-maximum-length-allowed"))
	assert.False(t, isValidContainerName("-invalid"))
	assert.False(t, isValidContainerName("invalid-"))
	
	// Test image name validation
	assert.True(t, isValidImageName("nginx:alpine"))
	assert.True(t, isValidImageName("redis"))
	assert.False(t, isValidImageName(""))
	assert.False(t, isValidImageName("image/with/../path"))
	assert.False(t, isValidImageName("image|with|pipes"))
	
	// Test string sanitization
	assert.Equal(t, "clean", sanitizeString("clean"))
	assert.Equal(t, "clean", sanitizeString("  clean  "))
	assert.Equal(t, "clean", sanitizeString("clean\r\n\t"))
	assert.Equal(t, "clean", sanitizeString("clean\x00"))
}
