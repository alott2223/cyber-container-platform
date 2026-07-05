package auth

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestLoginLockout(t *testing.T) {
	lockout := NewLoginLockout()
	key := "127.0.0.1:admin"
	lockoutDuration := 15 * time.Minute

	for i := 0; i < 5; i++ {
		lockout.RecordFailure(key, lockoutDuration)
	}

	locked, remaining := lockout.IsLocked(key, 5, lockoutDuration)
	assert.True(t, locked)
	assert.Greater(t, remaining.Seconds(), float64(0))

	lockout.Reset(key)
	locked, _ = lockout.IsLocked(key, 5, lockoutDuration)
	assert.False(t, locked)
}

func TestPasswordHashAndVerify(t *testing.T) {
	password := "SecurePass123!"
	hash, err := HashPassword(password, DefaultBcryptCost)
	assert.NoError(t, err)
	assert.True(t, CheckPassword(password, hash))
	assert.False(t, CheckPassword("wrong-password", hash))
}
