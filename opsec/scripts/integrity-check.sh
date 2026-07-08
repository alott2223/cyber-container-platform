#!/bin/sh
# OPSEC: File integrity monitoring baseline
set -eu

echo "[OPSEC] Running integrity check..."

BASELINE="/opsec/baseline.sha256"
CHECK_PATHS="/etc/passwd /etc/shadow /etc/hosts /opsec/scripts"

if [ ! -f "$BASELINE" ]; then
  echo "[OPSEC] Creating integrity baseline..."
  mkdir -p /opsec 2>/dev/null || true
  for path in $CHECK_PATHS; do
    [ -e "$path" ] || continue
    find "$path" -type f 2>/dev/null | while read -r f; do
      sha256sum "$f"
    done
  done > "$BASELINE" 2>/dev/null || true
  echo "[OPSEC] Baseline created: $(wc -l < "$BASELINE" 2>/dev/null || echo 0) files"
else
  VIOLATIONS=0
  while read -r expected_hash filepath; do
    [ -f "$filepath" ] || continue
    current=$(sha256sum "$filepath" | awk '{print $1}')
    if [ "$current" != "$expected_hash" ]; then
      echo "[OPSEC] INTEGRITY VIOLATION: $filepath"
      VIOLATIONS=$((VIOLATIONS + 1))
    fi
  done < "$BASELINE"
  if [ "$VIOLATIONS" -eq 0 ]; then
    echo "[OPSEC] Integrity check passed."
  else
    echo "[OPSEC] WARNING: $VIOLATIONS integrity violation(s) detected."
  fi
fi
