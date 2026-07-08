# Docker Troubleshooting

## Overlay mount error: `invalid argument`

If you see:

```
Error response from daemon: failed to mount ... overlay ... err: invalid argument
```

This happens on **nested filesystems** (cloud VMs, some CI environments, WSL1, Docker-in-Docker) where the kernel cannot stack overlay mounts.

### Fix (Linux)

Run the included fix script:

```bash
chmod +x scripts/fix-docker-overlay.sh
sudo ./scripts/fix-docker-overlay.sh
```

Or configure manually:

```bash
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json << 'EOF'
{
  "storage-driver": "vfs",
  "features": {
    "containerd-snapshotter": false
  }
}
EOF
sudo systemctl restart docker
```

Then verify:

```bash
docker run --rm alpine:3.21 echo "works"
```

### Notes

- **vfs** is slower than overlay2 but works everywhere
- On production bare-metal servers with native ext4/xfs, keep the default **overlay2** driver
- After switching drivers, you may need to re-pull images: `docker pull alpine:3.21`

### WSL2

Ensure Docker Desktop uses WSL2 backend, or run the vfs fix inside your Linux distro.
