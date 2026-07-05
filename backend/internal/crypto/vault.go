package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"fmt"
	"io"
)

const (
	// KeySizeBytes is AES-256 key length
	KeySizeBytes = 32
	// NonceSizeBytes is GCM standard nonce size
	NonceSizeBytes = 12
)

var (
	ErrInvalidKey        = errors.New("encryption key must be 32 bytes")
	ErrInvalidCiphertext = errors.New("invalid ciphertext")
	ErrEmptyPlaintext    = errors.New("plaintext cannot be empty")
)

// Vault provides AES-256-GCM authenticated encryption
type Vault struct {
	aead cipher.AEAD
}

// NewVault derives a 256-bit key from the master secret using SHA-256
func NewVault(masterSecret string) (*Vault, error) {
	if masterSecret == "" {
		return nil, errors.New("master secret is required")
	}

	key := sha256.Sum256([]byte(masterSecret))
	block, err := aes.NewCipher(key[:])
	if err != nil {
		return nil, fmt.Errorf("failed to create cipher: %w", err)
	}

	aead, err := cipher.NewGCM(block)
	if err != nil {
		return nil, fmt.Errorf("failed to create GCM: %w", err)
	}

	return &Vault{aead: aead}, nil
}

// Encrypt returns base64-encoded nonce+ciphertext
func (v *Vault) Encrypt(plaintext []byte) (string, error) {
	if len(plaintext) == 0 {
		return "", ErrEmptyPlaintext
	}

	nonce := make([]byte, NonceSizeBytes)
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", fmt.Errorf("failed to generate nonce: %w", err)
	}

	ciphertext := v.aead.Seal(nonce, nonce, plaintext, nil)
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

// Decrypt decodes base64 nonce+ciphertext and verifies authentication tag
func (v *Vault) Decrypt(encoded string) ([]byte, error) {
	ciphertext, err := base64.StdEncoding.DecodeString(encoded)
	if err != nil {
		return nil, fmt.Errorf("failed to decode ciphertext: %w", err)
	}

	if len(ciphertext) < NonceSizeBytes {
		return nil, ErrInvalidCiphertext
	}

	nonce := ciphertext[:NonceSizeBytes]
	data := ciphertext[NonceSizeBytes:]

	plaintext, err := v.aead.Open(nil, nonce, data, nil)
	if err != nil {
		return nil, ErrInvalidCiphertext
	}

	return plaintext, nil
}

// GenerateDataKey creates a random 256-bit key for envelope encryption
func GenerateDataKey() (string, error) {
	key := make([]byte, KeySizeBytes)
	if _, err := io.ReadFull(rand.Reader, key); err != nil {
		return "", err
	}
	return base64.StdEncoding.EncodeToString(key), nil
}

// SecureZero overwrites a byte slice in memory
func SecureZero(data []byte) {
	for i := range data {
		data[i] = 0
	}
}
