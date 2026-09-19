#!/bin/sh
# OPSEC: Kernel and system hardening baseline
set -eu

echo "[OPSEC] Applying system hardening..."

# Disable core dumps
ulimit -c 0 2>/dev/null || true

# Harden kernel parameters where writable
for param in \
  "kernel.randomize_va_space=2" \
  "kernel.kptr_restrict=2" \
  "kernel.dmesg_restrict=1" \
  "kernel.yama.ptrace_scope=2" \
  "fs.protected_hardlinks=1" \
  "fs.protected_symlinks=1" \
  "net.ipv4.conf.all.rp_filter=1" \
  "net.ipv4.conf.default.rp_filter=1" \
  "net.ipv4.tcp_syncookies=1" \
  "net.ipv4.conf.all.accept_redirects=0" \
  "net.ipv4.conf.default.accept_redirects=0" \
  "net.ipv4.conf.all.send_redirects=0" \
  "net.ipv6.conf.all.accept_redirects=0"; do
  key="${param%%=*}"
  val="${param#*=}"
  if [ -w "/proc/sys/${key//./\/}" ] 2>/dev/null; then
    echo "$val" > "/proc/sys/${key//./\/}" 2>/dev/null || true
  fi
done

# Restrict permissions on sensitive paths
chmod 700 /root 2>/dev/null || true
chmod 1777 /tmp 2>/dev/null || true

# Remove unnecessary SUID binaries in container context
find / -xdev -perm /6000 -type f 2>/dev/null | while read -r f; do
  case "$f" in
    /bin/su|/bin/mount|/bin/umount) ;;
    *) chmod u-s,g-s "$f" 2>/dev/null || true ;;
  esac
done

echo "[OPSEC] System hardening complete."
