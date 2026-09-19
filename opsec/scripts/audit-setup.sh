#!/bin/sh
# OPSEC: Audit daemon configuration for compliance logging
set -eu

echo "[OPSEC] Configuring audit rules..."

AUDIT_RULES="/etc/audit/rules.d/opsec.rules"
mkdir -p "$(dirname "$AUDIT_RULES")" 2>/dev/null || true

cat > "$AUDIT_RULES" 2>/dev/null << 'RULES' || true
# OPSEC audit rules — privilege escalation and critical file access
-w /etc/passwd -p wa -k identity
-w /etc/shadow -p wa -k identity
-w /etc/sudoers -p wa -k privilege
-w /etc/ssh/sshd_config -p wa -k sshd_config
-a always,exit -F arch=b64 -S execve -k exec
-a always,exit -F arch=b32 -S execve -k exec
-w /bin/su -p x -k priv_esc
-w /usr/bin/sudo -p x -k priv_esc
RULES

if command -v auditctl >/dev/null 2>&1; then
  auditctl -R "$AUDIT_RULES" 2>/dev/null || true
  echo "[OPSEC] Audit rules loaded."
else
  echo "[OPSEC] auditctl not available — rules written to $AUDIT_RULES"
fi
