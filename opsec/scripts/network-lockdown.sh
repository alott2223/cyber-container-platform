#!/bin/sh
# OPSEC: Default-deny egress firewall with essential allowlist
set -eu

echo "[OPSEC] Configuring network lockdown..."

if ! command -v iptables >/dev/null 2>&1; then
  echo "[OPSEC] iptables not available — skipping (non-privileged container)"
  exit 0
fi

# Flush existing rules
iptables -F OUTPUT 2>/dev/null || true
iptables -P OUTPUT DROP 2>/dev/null || true

# Allow established connections
iptables -A OUTPUT -m state --state ESTABLISHED,RELATED -j ACCEPT 2>/dev/null || true

# Allow loopback
iptables -A OUTPUT -o lo -j ACCEPT 2>/dev/null || true

# Allow DNS
iptables -A OUTPUT -p udp --dport 53 -j ACCEPT 2>/dev/null || true
iptables -A OUTPUT -p tcp --dport 53 -j ACCEPT 2>/dev/null || true

# Allow HTTPS for package updates and encrypted comms
iptables -A OUTPUT -p tcp --dport 443 -j ACCEPT 2>/dev/null || true

echo "[OPSEC] Network lockdown active (default-deny egress)."
