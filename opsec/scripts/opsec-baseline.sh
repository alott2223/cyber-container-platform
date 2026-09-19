#!/bin/sh
# OPSEC: Master baseline orchestrator — runs full OPSEC initialization
set -eu

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG="/opsec/logs/baseline.log"

mkdir -p /opsec/logs 2>/dev/null || true

echo "============================================"
echo "  CYBER CONTAINER PLATFORM — OPSEC BASELINE"
echo "  $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
echo "============================================"

run_script() {
  script="$SCRIPT_DIR/$1"
  if [ -x "$script" ] || [ -f "$script" ]; then
    echo ""
    echo ">>> Running: $1"
    sh "$script" 2>&1 | tee -a "$LOG" || echo "[WARN] $1 exited with error"
  fi
}

run_script "init-hardening.sh"
run_script "memory-protection.sh"
run_script "container-isolation.sh"
run_script "dns-hardening.sh"
run_script "integrity-check.sh"
run_script "log-sanitization.sh"

# Network lockdown only if NET_ADMIN capability present
if [ -c /dev/net/tun ] || [ -w /proc/sys/net ]; then
  run_script "network-lockdown.sh"
else
  echo "[INFO] Skipping network-lockdown (insufficient privileges)"
fi

echo ""
echo "============================================"
echo "  OPSEC BASELINE COMPLETE"
echo "  Log: $LOG"
echo "============================================"
