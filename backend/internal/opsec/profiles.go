package opsec

import (
	"os"
	"path/filepath"
	"strings"

	"github.com/docker/docker/api/types/container"
)

// SecurityLevel defines container hardening tiers
type SecurityLevel string

const (
	LevelStandard SecurityLevel = "standard"
	LevelHardened SecurityLevel = "hardened"
	LevelMaximum  SecurityLevel = "maximum"
	LevelAirgap   SecurityLevel = "airgap"
)

// Script describes a preloaded OPSEC script
type Script struct {
	ID          string   `json:"id"`
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Category    string   `json:"category"`
	Filename    string   `json:"filename"`
	Tags        []string `json:"tags"`
}

// Profile defines a deployable OPSEC container profile
type Profile struct {
	ID              string        `json:"id"`
	Name            string        `json:"name"`
	Description     string        `json:"description"`
	Image           string        `json:"image"`
	SecurityLevel   SecurityLevel `json:"security_level"`
	Icon            string        `json:"icon"`
	Category        string        `json:"category"`
	Scripts         []string      `json:"scripts"`
	Ports           map[string]string `json:"ports,omitempty"`
	Environment     map[string]string `json:"environment,omitempty"`
	Volumes         []string      `json:"volumes,omitempty"`
	Capabilities    []string      `json:"capabilities,omitempty"`
	ReadOnlyRoot    bool          `json:"read_only_root"`
	NoNewPrivileges bool          `json:"no_new_privileges"`
	NetworkMode     string        `json:"network_mode,omitempty"`
	Tmpfs           []string      `json:"tmpfs,omitempty"`
	Command         []string      `json:"command,omitempty"`
}

var Scripts = []Script{
	{ID: "init-hardening", Name: "System Hardening", Description: "Kernel sysctl hardening, ulimits, disable core dumps, ASLR enforcement", Category: "baseline", Filename: "init-hardening.sh", Tags: []string{"hardening", "kernel", "baseline"}},
	{ID: "network-lockdown", Name: "Network Lockdown", Description: "Default-deny egress firewall with allowlist for essential services", Category: "network", Filename: "network-lockdown.sh", Tags: []string{"firewall", "iptables", "egress"}},
	{ID: "secure-wipe", Name: "Secure Wipe", Description: "Cryptographic wipe of temp files, logs, and swap artifacts", Category: "data", Filename: "secure-wipe.sh", Tags: []string{"shred", "cleanup", "forensics"}},
	{ID: "audit-setup", Name: "Audit Daemon", Description: "Configure auditd rules for exec, privilege escalation, and file access", Category: "monitoring", Filename: "audit-setup.sh", Tags: []string{"auditd", "compliance", "logging"}},
	{ID: "dns-hardening", Name: "DNS Hardening", Description: "DNS-over-TLS configuration and DNS leak prevention", Category: "network", Filename: "dns-hardening.sh", Tags: []string{"dns", "dot", "privacy"}},
	{ID: "integrity-check", Name: "Integrity Verification", Description: "SHA-256 baseline verification of critical system files", Category: "monitoring", Filename: "integrity-check.sh", Tags: []string{"fim", "integrity", "tamper"}},
	{ID: "opsec-baseline", Name: "OPSEC Baseline", Description: "Master script orchestrating full OPSEC initialization sequence", Category: "baseline", Filename: "opsec-baseline.sh", Tags: []string{"orchestrator", "full", "deploy"}},
	{ID: "memory-protection", Name: "Memory Protection", Description: "Enable memory locking, disable ptrace, restrict /proc exposure", Category: "hardening", Filename: "memory-protection.sh", Tags: []string{"memory", "ptrace", "proc"}},
	{ID: "log-sanitization", Name: "Log Sanitization", Description: "Strip sensitive data from logs and configure log rotation with encryption", Category: "data", Filename: "log-sanitization.sh", Tags: []string{"logs", "pii", "rotation"}},
	{ID: "container-isolation", Name: "Container Isolation", Description: "Namespace isolation checks and seccomp profile validation", Category: "hardening", Filename: "container-isolation.sh", Tags: []string{"seccomp", "namespaces", "isolation"}},
}

var Profiles = []Profile{
	{
		ID: "alpine-opsec", Name: "Alpine OPSEC", Description: "Minimal hardened Alpine Linux with full OPSEC script suite preloaded",
		Image: "alpine:3.20", SecurityLevel: LevelMaximum, Icon: "🏔️", Category: "linux",
		Scripts: []string{"opsec-baseline", "init-hardening", "network-lockdown", "memory-protection"},
		ReadOnlyRoot: true, NoNewPrivileges: true,
		Tmpfs: []string{"/tmp:rw,noexec,nosuid,size=64m", "/run:rw,noexec,nosuid,size=32m"},
		Command: []string{"/bin/sh", "-c", "chmod +x /opsec/scripts/*.sh && /opsec/scripts/opsec-baseline.sh && tail -f /dev/null"},
	},
	{
		ID: "debian-opsec", Name: "Debian Secure", Description: "Debian Bookworm with CIS benchmark hardening and audit logging",
		Image: "debian:bookworm-slim", SecurityLevel: LevelHardened, Icon: "🛡️", Category: "linux",
		Scripts: []string{"opsec-baseline", "init-hardening", "audit-setup", "integrity-check"},
		ReadOnlyRoot: true, NoNewPrivileges: true,
		Tmpfs: []string{"/tmp:rw,noexec,nosuid,size=128m"},
		Command: []string{"/bin/bash", "-c", "chmod +x /opsec/scripts/*.sh && /opsec/scripts/opsec-baseline.sh && tail -f /dev/null"},
	},
	{
		ID: "ubuntu-opsec", Name: "Ubuntu OPSEC Workstation", Description: "Ubuntu LTS security workstation with monitoring and DNS hardening",
		Image: "ubuntu:24.04", SecurityLevel: LevelHardened, Icon: "🐧", Category: "linux",
		Scripts: []string{"opsec-baseline", "init-hardening", "dns-hardening", "audit-setup", "log-sanitization"},
		ReadOnlyRoot: false, NoNewPrivileges: true,
		Environment: map[string]string{"DEBIAN_FRONTEND": "noninteractive", "OPSEC_MODE": "workstation"},
		Command: []string{"/bin/bash", "-c", "chmod +x /opsec/scripts/*.sh && /opsec/scripts/opsec-baseline.sh && tail -f /dev/null"},
	},
	{
		ID: "wireguard-gateway", Name: "WireGuard Gateway", Description: "Encrypted VPN gateway container with network lockdown and kill-switch",
		Image: "linuxserver/wireguard:latest", SecurityLevel: LevelMaximum, Icon: "🔐", Category: "network",
		Scripts: []string{"network-lockdown", "dns-hardening", "memory-protection"},
		Ports: map[string]string{"51820": "51820/udp"},
		Capabilities: []string{"NET_ADMIN", "SYS_MODULE"},
		ReadOnlyRoot: false, NoNewPrivileges: true,
		Environment: map[string]string{"PUID": "1000", "PGID": "1000"},
		Volumes: []string{"wireguard-config:/config"},
	},
	{
		ID: "tor-gateway", Name: "Tor Gateway", Description: "Privacy-focused Tor routing gateway with strict egress controls",
		Image: "dperson/torproxy:latest", SecurityLevel: LevelMaximum, Icon: "🧅", Category: "network",
		Scripts: []string{"network-lockdown", "dns-hardening", "secure-wipe"},
		Ports: map[string]string{"9050": "9050", "9051": "9051"},
		ReadOnlyRoot: true, NoNewPrivileges: true,
		NetworkMode: "bridge",
	},
	{
		ID: "vault-container", Name: "Encrypted Vault", Description: "Air-gapped secrets vault with AES-256 at-rest encryption and secure wipe",
		Image: "alpine:3.20", SecurityLevel: LevelAirgap, Icon: "🔒", Category: "security",
		Scripts: []string{"opsec-baseline", "secure-wipe", "memory-protection", "container-isolation"},
		ReadOnlyRoot: true, NoNewPrivileges: true,
		NetworkMode: "none",
		Tmpfs: []string{"/vault:rw,noexec,nosuid,size=256m", "/tmp:rw,noexec,nosuid,size=32m"},
		Environment: map[string]string{"VAULT_ENCRYPTION": "aes-256-gcm", "OPSEC_AIRGAP": "true"},
		Command: []string{"/bin/sh", "-c", "chmod +x /opsec/scripts/*.sh && /opsec/scripts/opsec-baseline.sh && echo 'Vault ready' && tail -f /dev/null"},
	},
	{
		ID: "security-lab", Name: "Security Lab", Description: "Penetration testing lab environment with audit logging and integrity monitoring",
		Image: "kalilinux/kali-rolling", SecurityLevel: LevelStandard, Icon: "🔬", Category: "linux",
		Scripts: []string{"init-hardening", "audit-setup", "integrity-check", "log-sanitization"},
		ReadOnlyRoot: false, NoNewPrivileges: true,
		Environment: map[string]string{"OPSEC_LAB": "true"},
		Command: []string{"/bin/bash", "-c", "chmod +x /opsec/scripts/*.sh 2>/dev/null; /opsec/scripts/opsec-baseline.sh 2>/dev/null; tail -f /dev/null"},
	},
	{
		ID: "fedora-opsec", Name: "Fedora SELinux", Description: "Fedora with SELinux enforcing mode and full OPSEC baseline",
		Image: "fedora:40", SecurityLevel: LevelHardened, Icon: "🎩", Category: "linux",
		Scripts: []string{"opsec-baseline", "init-hardening", "audit-setup", "container-isolation"},
		ReadOnlyRoot: false, NoNewPrivileges: true,
		Environment: map[string]string{"OPSEC_SELINUX": "enforcing"},
		Command: []string{"/bin/bash", "-c", "chmod +x /opsec/scripts/*.sh && /opsec/scripts/opsec-baseline.sh && tail -f /dev/null"},
	},
}

// ApplySecurityProfile configures Docker host security options
func ApplySecurityProfile(hostConfig *container.HostConfig, level SecurityLevel, profile *Profile) {
	if hostConfig == nil {
		return
	}

	hostConfig.CapDrop = []string{"ALL"}
	if profile != nil && len(profile.Capabilities) > 0 {
		hostConfig.CapAdd = profile.Capabilities
	}

	hostConfig.SecurityOpt = []string{
		"no-new-privileges:true",
		"seccomp=default",
		"apparmor=docker-default",
	}

	switch level {
	case LevelHardened, LevelMaximum, LevelAirgap:
		readOnly := true
		if profile != nil && !profile.ReadOnlyRoot {
			readOnly = false
		}
		hostConfig.ReadonlyRootfs = readOnly
		hostConfig.Privileged = false
		hostConfig.Init = boolPtr(true)
	}

	if profile != nil {
		if profile.NoNewPrivileges {
			hostConfig.SecurityOpt = append(hostConfig.SecurityOpt, "no-new-privileges:true")
		}
		if len(profile.Tmpfs) > 0 {
			hostConfig.Tmpfs = make(map[string]string)
			for _, mount := range profile.Tmpfs {
				parts := strings.SplitN(mount, ":", 2)
				if len(parts) == 2 {
					hostConfig.Tmpfs[parts[0]] = parts[1]
				}
			}
		}
		if profile.NetworkMode != "" {
			hostConfig.NetworkMode = container.NetworkMode(profile.NetworkMode)
		}
	}

	if level == LevelAirgap {
		hostConfig.NetworkMode = "none"
		hostConfig.ReadonlyRootfs = true
	}
}

func boolPtr(v bool) *bool { return &v }

// GetProfile returns a profile by ID
func GetProfile(id string) *Profile {
	for i := range Profiles {
		if Profiles[i].ID == id {
			return &Profiles[i]
		}
	}
	return nil
}

// GetScript returns a script by ID
func GetScript(id string) *Script {
	for i := range Scripts {
		if Scripts[i].ID == id {
			return &Scripts[i]
		}
	}
	return nil
}

// ScriptsDir returns the path to bundled OPSEC scripts
func ScriptsDir() string {
	if dir := os.Getenv("OPSEC_SCRIPTS_DIR"); dir != "" {
		return dir
	}
	candidates := []string{
		"./opsec/scripts",
		"/app/opsec/scripts",
		"/workspace/opsec/scripts",
	}
	for _, c := range candidates {
		if info, err := os.Stat(c); err == nil && info.IsDir() {
			abs, _ := filepath.Abs(c)
			return abs
		}
	}
	return "./opsec/scripts"
}

// ScriptMountBinds returns volume binds to inject OPSEC scripts into containers
func ScriptMountBinds() []string {
	scriptsDir := ScriptsDir()
	if _, err := os.Stat(scriptsDir); err != nil {
		return nil
	}
	return []string{scriptsDir + ":/opsec/scripts:ro"}
}

// ReadScriptContent loads a script file by ID
func ReadScriptContent(scriptID string) (string, error) {
	script := GetScript(scriptID)
	if script == nil {
		return "", os.ErrNotExist
	}
	path := filepath.Join(ScriptsDir(), script.Filename)
	data, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}
	return string(data), nil
}
