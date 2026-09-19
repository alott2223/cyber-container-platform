#!/bin/sh
# OPSEC: Memory protection and ptrace restrictions
set -eu

echo "[OPSEC] Enabling memory protection..."

# Restrict ptrace scope
if [ -w /proc/sys/kernel/yama/ptrace_scope ]; then
  echo 2 > /proc/sys/kernel/yama/ptrace_scope
fi

# Disable core dumps
if [ -w /proc/sys/kernel/core_pattern ]; then
  echo "|/bin/false" > /proc/sys/kernel/core_pattern 2>/dev/null || true
fi

# Lock memory for sensitive processes if possible
if command -v prlimit >/dev/null 2>&1; then
  prlimit --core=0 --nproc=512 2>/dev/null || true
fi

# Restrict /proc visibility
if [ -w /proc/sys/kernel/pid_max ]; then
  : # pid_max is informational only
fi

# Mount /proc with hidepid if remountable
mount -o remount,hidepid=2 /proc 2>/dev/null || true

echo "[OPSEC] Memory protection enabled."
