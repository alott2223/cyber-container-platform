package config

import (
	"testing"
	"time"

	"cyber-container-platform/internal/auth"
	"github.com/stretchr/testify/assert"
)

func TestLoadDefaults(t *testing.T) {
	cfg := Load()

	assert.Equal(t, "8080", cfg.Port)
	assert.Equal(t, EnvDevelopment, cfg.Environment)
	assert.False(t, cfg.AllowRegistration)
	assert.Equal(t, 5, cfg.MaxLoginAttempts)
	assert.Equal(t, 24*time.Hour, cfg.JWTExpiry)
}

func TestValidateProductionRequiresSecureJWT(t *testing.T) {
	cfg := &Config{
		Environment:   EnvProduction,
		JWTSecret:     "cyber-secret-key-change-in-production",
		AdminPassword: "SecurePass123!",
	}

	err := cfg.Validate()
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "JWT_SECRET")
}

func TestValidateProductionRequiresAdminPassword(t *testing.T) {
	cfg := &Config{
		Environment: EnvProduction,
		JWTSecret:   "this-is-a-very-secure-jwt-secret-key-for-production",
	}

	err := cfg.Validate()
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "ADMIN_PASSWORD")
}

func TestValidatePasswordRequirements(t *testing.T) {
	cfg := &Config{
		Environment:   EnvProduction,
		JWTSecret:     "this-is-a-very-secure-jwt-secret-key-for-production",
		AdminPassword: "weak",
	}

	err := cfg.Validate()
	assert.Error(t, err)
}

func TestIsProduction(t *testing.T) {
	cfg := &Config{Environment: EnvProduction}
	assert.True(t, cfg.IsProduction())

	cfg.Environment = EnvDevelopment
	assert.False(t, cfg.IsProduction())
}

func TestAuthHelpers(t *testing.T) {
	assert.True(t, auth.IsDefaultJWTSecret("cyber-secret-key-change-in-production"))
	assert.False(t, auth.IsDefaultJWTSecret("custom-secret-value-that-is-long-enough"))

	assert.NoError(t, auth.ValidateUsername("admin_user-1"))
	assert.Error(t, auth.ValidateUsername("ab"))

	assert.Error(t, auth.ValidatePassword("short"))
	assert.NoError(t, auth.ValidatePassword("SecurePass123!"))
}
