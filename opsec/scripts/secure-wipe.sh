#!/bin/sh
# OPSEC: Cryptographic secure wipe of temporary artifacts
set -eu

echo "[OPSEC] Running secure wipe..."

WIPE_PATHS="/tmp /var/tmp /opsec/wipe"

for dir in $WIPE_PATHS; do
  [ -d "$dir" ] || continue
  find "$dir" -type f 2>/dev/null | while read -r file; do
    if command -v shred >/dev/null 2>&1; then
      shred -u -z -n 3 "$file" 2>/dev/null || rm -f "$file"
    else
      # Fallback: overwrite with random data then delete
      dd if=/dev/urandom of="$file" bs=1k count=1 conv=notrunc 2>/dev/null || true
      rm -f "$file"
    fi
  done
done

# Clear shell history
history -c 2>/dev/null || true
unset HISTFILE 2>/dev/null || true

echo "[OPSEC] Secure wipe complete."
