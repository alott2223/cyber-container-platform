#!/bin/bash
# Fix Docker overlay mount errors on nested/restricted filesystems (cloud VMs, WSL, etc.)
# Error: failed to mount ... overlay ... err: invalid argument
set -e

echo "Checking Docker storage driver..."
CURRENT=$(docker info 2>/dev/null | grep "Storage Driver" | awk '{print $3}' || echo "unknown")

if [ "$CURRENT" = "vfs" ]; then
  echo "Docker already uses vfs storage driver."
  exit 0
fi

echo "Current storage driver: $CURRENT"
echo "Configuring Docker to use vfs (compatible with nested overlay filesystems)..."

if [ "$(id -u)" -ne 0 ]; then
  SUDO=sudo
else
  SUDO=
fi

$SUDO mkdir -p /etc/docker
$SUDO tee /etc/docker/daemon.json > /dev/null << 'EOF'
{
  "storage-driver": "vfs",
  "features": {
    "containerd-snapshotter": false
  }
}
EOF

echo "Restarting Docker..."
if command -v systemctl &>/dev/null && systemctl is-active docker &>/dev/null; then
  $SUDO systemctl restart docker
elif command -v service &>/dev/null; then
  $SUDO service docker restart
else
  echo "Please restart Docker manually: sudo pkill dockerd && sudo dockerd &"
  exit 1
fi

sleep 3
echo "Testing container runtime..."
docker run --rm alpine:3.21 echo "Docker overlay fix successful!"
echo "Done. Containers should now start without overlay mount errors."
