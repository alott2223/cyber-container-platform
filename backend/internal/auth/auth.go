package auth

import (
	"fmt"
	"strings"
	"sync"
	"time"
	"unicode"

	"golang.org/x/crypto/bcrypt"
)

const (
	MinPasswordLength = 12
	DefaultBcryptCost = 12
)

type LoginLockout struct {
	mu       sync.Mutex
	attempts map[string][]time.Time
}

func NewLoginLockout() *LoginLockout {
	return &LoginLockout{
		attempts: make(map[string][]time.Time),
	}
}

func (l *LoginLockout) IsLocked(key string, maxAttempts int, lockoutDuration time.Duration) (bool, time.Duration) {
	l.mu.Lock()
	defer l.mu.Unlock()

	now := time.Now()
	attempts := l.pruneAttempts(key, now, lockoutDuration)

	if len(attempts) >= maxAttempts {
		oldest := attempts[0]
		remaining := lockoutDuration - now.Sub(oldest)
		if remaining > 0 {
			return true, remaining
		}
	}

	return false, 0
}

func (l *LoginLockout) RecordFailure(key string, lockoutDuration time.Duration) {
	l.mu.Lock()
	defer l.mu.Unlock()

	now := time.Now()
	attempts := l.pruneAttempts(key, now, lockoutDuration)
	l.attempts[key] = append(attempts, now)
}

func (l *LoginLockout) Reset(key string) {
	l.mu.Lock()
	defer l.mu.Unlock()
	delete(l.attempts, key)
}

func (l *LoginLockout) pruneAttempts(key string, now time.Time, lockoutDuration time.Duration) []time.Time {
	attempts := l.attempts[key]
	valid := make([]time.Time, 0, len(attempts))
	for _, attempt := range attempts {
		if now.Sub(attempt) < lockoutDuration {
			valid = append(valid, attempt)
		}
	}
	l.attempts[key] = valid
	return valid
}

func ValidatePassword(password string) error {
	if len(password) < MinPasswordLength {
		return fmt.Errorf("password must be at least %d characters", MinPasswordLength)
	}

	var hasUpper, hasLower, hasDigit, hasSpecial bool
	for _, char := range password {
		switch {
		case unicode.IsUpper(char):
			hasUpper = true
		case unicode.IsLower(char):
			hasLower = true
		case unicode.IsDigit(char):
			hasDigit = true
		case unicode.IsPunct(char) || unicode.IsSymbol(char):
			hasSpecial = true
		}
	}

	if !hasUpper || !hasLower || !hasDigit || !hasSpecial {
		return fmt.Errorf("password must include uppercase, lowercase, number, and special character")
	}

	return nil
}

func HashPassword(password string, cost int) (string, error) {
	if cost <= 0 {
		cost = DefaultBcryptCost
	}
	hashed, err := bcrypt.GenerateFromPassword([]byte(password), cost)
	if err != nil {
		return "", err
	}
	return string(hashed), nil
}

func CheckPassword(password, hash string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) == nil
}

func ValidateUsername(username string) error {
	username = strings.TrimSpace(username)
	if len(username) < 3 || len(username) > 32 {
		return fmt.Errorf("username must be between 3 and 32 characters")
	}

	for _, char := range username {
		if !unicode.IsLetter(char) && !unicode.IsDigit(char) && char != '_' && char != '-' {
			return fmt.Errorf("username may only contain letters, numbers, hyphens, and underscores")
		}
	}

	return nil
}

func IsDefaultJWTSecret(secret string) bool {
	return secret == "" || secret == "cyber-secret-key-change-in-production" ||
		secret == "your-super-secret-jwt-key-change-this-in-production"
}
