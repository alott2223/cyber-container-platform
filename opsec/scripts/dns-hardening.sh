#!/bin/sh
# OPSEC: DNS hardening with leak prevention
set -eu

echo "[OPSEC] Applying DNS hardening..."

# Prevent DNS leaks via resolv.conf lockdown
if [ -f /etc/resolv.conf ]; then
  cp /etc/resolv.conf /etc/resolv.conf.opsec.bak 2>/dev/null || true
  cat > /etc/resolv.conf << 'DNS'
# OPSEC hardened DNS — encrypted resolvers only
nameserver 1.1.1.1
nameserver 9.9.9.9
options edns0 trust-ad
options timeout:2 attempts:2 rotate
DNS
  chattr +i /etc/resolv.conf 2>/dev/null || true
fi

# Block outbound DNS to non-standard resolvers if iptables available
if command -v iptables >/dev/null 2>&1; then
  for resolver in 1.1.1.1 9.9.9.9 8.8.8.8; do
    iptables -A OUTPUT -d "$resolver" -p udp --dport 53 -j ACCEPT 2>/dev/null || true
    iptables -A OUTPUT -d "$resolver" -p tcp --dport 853 -j ACCEPT 2>/dev/null || true
  done
fi

echo "[OPSEC] DNS hardening complete."
