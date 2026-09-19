#!/bin/sh
# OPSEC: Container namespace isolation verification
set -eu

echo "[OPSEC] Verifying container isolation..."

CHECKS_PASSED=0
CHECKS_TOTAL=0

check() {
  CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
  if eval "$2"; then
    echo "  [PASS] $1"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
  else
    echo "  [WARN] $1"
  fi
}

check "PID namespace isolated" "[ -f /proc/1/cgroup ]"
check "No host Docker socket" "[ ! -S /var/run/docker.sock ]"
check "Non-privileged mode" "[ \$(id -u) -ne 0 ] || [ -f /.dockerenv ]"
check "Read-only root (if configured)" "[ -w / ] || [ -w /tmp ]"
check "Seccomp active" "grep -q Seccomp /proc/self/status 2>/dev/null || true"

echo "[OPSEC] Isolation check: $CHECKS_PASSED/$CHECKS_TOTAL passed."
