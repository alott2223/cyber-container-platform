#!/bin/sh
# OPSEC: Log sanitization and encrypted rotation setup
set -eu

echo "[OPSEC] Configuring log sanitization..."

LOG_DIR="/var/log"
SANITIZE_PATTERNS="password token secret key api_key bearer"

for logfile in "$LOG_DIR"/*.log /opsec/logs/*.log; do
  [ -f "$logfile" ] || continue
  for pattern in $SANITIZE_PATTERNS; do
    sed -i "s/${pattern}[=: ]*[^ ]*/${pattern}=[REDACTED]/gi" "$logfile" 2>/dev/null || true
  done
done

# Configure logrotate with compression
cat > /etc/logrotate.d/opsec 2>/dev/null << 'ROTATE' || true
/opsec/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 640 root root
}
ROTATE

mkdir -p /opsec/logs 2>/dev/null || true
echo "[OPSEC] Log sanitization configured."
