package opsec

import (
	"testing"

	"github.com/docker/docker/api/types/container"
	"github.com/stretchr/testify/assert"
)

func TestGetProfile(t *testing.T) {
	profile := GetProfile("alpine-opsec")
	assert.NotNil(t, profile)
	assert.Equal(t, "maximum", string(profile.SecurityLevel))
	assert.Contains(t, profile.Scripts, "opsec-baseline")
}

func TestGetScript(t *testing.T) {
	script := GetScript("init-hardening")
	assert.NotNil(t, script)
	assert.Equal(t, "init-hardening.sh", script.Filename)
}

func TestApplySecurityProfileAirgap(t *testing.T) {
	hostConfig := &container.HostConfig{}
	profile := GetProfile("vault-container")
	ApplySecurityProfile(hostConfig, LevelAirgap, profile)

	assert.Equal(t, container.NetworkMode("none"), hostConfig.NetworkMode)
	assert.True(t, hostConfig.ReadonlyRootfs)
	assert.Contains(t, hostConfig.CapDrop, "ALL")
}

func TestScriptsCatalog(t *testing.T) {
	assert.GreaterOrEqual(t, len(Scripts), 8)
	assert.GreaterOrEqual(t, len(Profiles), 6)
}
