package crypto

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestVaultEncryptDecrypt(t *testing.T) {
	vault, err := NewVault("government-grade-master-secret-key-for-testing")
	require.NoError(t, err)

	plaintext := []byte("classified-container-credentials-2026")
	encrypted, err := vault.Encrypt(plaintext)
	require.NoError(t, err)
	assert.NotEqual(t, string(plaintext), encrypted)

	decrypted, err := vault.Decrypt(encrypted)
	require.NoError(t, err)
	assert.Equal(t, plaintext, decrypted)
}

func TestVaultTamperDetection(t *testing.T) {
	vault, err := NewVault("tamper-test-secret-key-minimum-length")
	require.NoError(t, err)

	encrypted, err := vault.Encrypt([]byte("secret data"))
	require.NoError(t, err)

	_, err = vault.Decrypt(encrypted[:len(encrypted)-4] + "XXXX")
	assert.Error(t, err)
}

func TestVaultRequiresMasterSecret(t *testing.T) {
	_, err := NewVault("")
	assert.Error(t, err)
}

func TestGenerateDataKey(t *testing.T) {
	key1, err := GenerateDataKey()
	require.NoError(t, err)
	key2, err := GenerateDataKey()
	require.NoError(t, err)
	assert.NotEqual(t, key1, key2)
	assert.Len(t, key1, 44) // base64 of 32 bytes
}
