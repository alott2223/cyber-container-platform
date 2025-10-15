# 📦 Installation Guide

This guide will walk you through installing Cyber Container Platform on various operating systems and deployment scenarios.

## 🖥️ System Requirements

### Minimum Requirements
- **CPU**: 2 cores
- **RAM**: 4GB
- **Storage**: 10GB free space
- **OS**: Linux, macOS, or Windows
- **Docker**: 20.10+ with Docker Compose 2.0+

### Recommended Requirements
- **CPU**: 4+ cores
- **RAM**: 8GB+
- **Storage**: 50GB+ SSD
- **OS**: Ubuntu 20.04+, CentOS 8+, or Windows 10+
- **Docker**: Latest stable version

## 🚀 Quick Installation

### Prerequisites

1. **Install Docker**
   - [Docker Desktop](https://www.docker.com/products/docker-desktop) (Windows/macOS)
   - [Docker Engine](https://docs.docker.com/engine/install/) (Linux)

2. **Install Docker Compose**
   - Usually included with Docker Desktop
   - [Install Docker Compose](https://docs.docker.com/compose/install/) (Linux)

3. **Verify Installation**
   ```bash
   docker --version
   docker-compose --version
   ```

### Installation Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/cyber-container-platform.git
   cd cyber-container-platform
   ```

2. **Run the Installation Script**
   ```bash
   # Linux/macOS
   chmod +x deploy.sh
   ./deploy.sh
   
   # Windows
   deploy.bat
   ```

3. **Access the Platform**
   - Open your browser to `http://localhost:3000`
   - Login with `admin` / `admin`
   - **Change the default password immediately!**

## 🐧 Linux Installation

### Ubuntu/Debian

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again to apply group changes
logout
```

### CentOS/RHEL

```bash
# Install Docker
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install -y docker-ce docker-ce-cli containerd.io
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Arch Linux

```bash
# Install Docker
sudo pacman -S docker docker-compose
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
```

## 🍎 macOS Installation

### Using Homebrew

```bash
# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Docker Desktop
brew install --cask docker

# Start Docker Desktop
open /Applications/Docker.app
```

### Manual Installation

1. Download [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop)
2. Install the `.dmg` file
3. Start Docker Desktop from Applications

## 🪟 Windows Installation

### Using Chocolatey

```powershell
# Install Chocolatey (if not already installed)
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install Docker Desktop
choco install docker-desktop
```

### Manual Installation

1. Download [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop)
2. Run the installer
3. Enable WSL 2 integration (recommended)
4. Restart your computer

## 🐳 Docker Installation

### Development Environment

```bash
# Clone the repository
git clone https://github.com/yourusername/cyber-container-platform.git
cd cyber-container-platform

# Start development environment
docker-compose up -d

# View logs
docker-compose logs -f
```

### Production Environment

```bash
# Clone the repository
git clone https://github.com/yourusername/cyber-container-platform.git
cd cyber-container-platform

# Start production environment
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps
```

## ☁️ Cloud Deployment

### AWS EC2

```bash
# Launch Ubuntu 20.04 LTS instance
# SSH into the instance

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Clone and deploy
git clone https://github.com/yourusername/cyber-container-platform.git
cd cyber-container-platform
./deploy.sh
```

### Google Cloud Platform

```bash
# Create VM instance
gcloud compute instances create cyber-platform \
    --image-family=ubuntu-2004-lts \
    --image-project=ubuntu-os-cloud \
    --machine-type=e2-medium \
    --zone=us-central1-a

# SSH into instance
gcloud compute ssh cyber-platform --zone=us-central1-a

# Follow Ubuntu installation steps above
```

### Azure

```bash
# Create VM using Azure CLI
az vm create \
    --resource-group myResourceGroup \
    --name cyber-platform \
    --image UbuntuLTS \
    --size Standard_B2s \
    --admin-username azureuser \
    --generate-ssh-keys

# SSH into VM
ssh azureuser@<public-ip>

# Follow Ubuntu installation steps above
```

## 🏠 Home Lab Setup

### Raspberry Pi

```bash
# Install Docker on Raspberry Pi OS
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker pi

# Install Docker Compose
sudo apt install -y python3-pip
sudo pip3 install docker-compose

# Clone and deploy
git clone https://github.com/yourusername/cyber-container-platform.git
cd cyber-container-platform
./deploy.sh
```

### Synology NAS

1. Install Docker package from Package Center
2. Enable SSH on your Synology
3. SSH into your NAS
4. Follow Linux installation steps

### Unraid

1. Install Docker plugin
2. Access terminal via web interface
3. Follow Linux installation steps

## 🔧 Advanced Installation

### Custom Configuration

```bash
# Clone repository
git clone https://github.com/yourusername/cyber-container-platform.git
cd cyber-container-platform

# Copy and modify configuration
cp backend/config/production.yaml backend/config/custom.yaml

# Edit configuration
nano backend/config/custom.yaml

# Deploy with custom config
CONFIG_PATH=./backend/config/custom.yaml docker-compose -f docker-compose.prod.yml up -d
```

### High Availability Setup

```bash
# Set up load balancer
# Configure multiple backend instances
# Set up database clustering
# Configure shared storage
```

### Kubernetes Deployment

```bash
# Create Kubernetes manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get pods
kubectl get services
```

## 🐛 Troubleshooting

### Common Issues

#### Docker Not Running
```bash
# Check Docker status
sudo systemctl status docker

# Start Docker
sudo systemctl start docker

# Enable Docker on boot
sudo systemctl enable docker
```

#### Permission Denied
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Logout and login again
logout
```

#### Port Already in Use
```bash
# Check what's using the port
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :8080

# Kill the process
sudo kill -9 <PID>
```

#### Out of Disk Space
```bash
# Clean up Docker
docker system prune -a

# Check disk usage
df -h
```

### Logs and Debugging

```bash
# View application logs
docker-compose logs -f backend
docker-compose logs -f frontend

# View system logs
sudo journalctl -u docker

# Debug container
docker exec -it <container-name> /bin/bash
```

## ✅ Verification

### Health Checks

```bash
# Check backend health
curl http://localhost:8080/api/v1/health

# Check frontend
curl http://localhost:3000

# Check all services
docker-compose ps
```

### Expected Output

```json
{
  "status": "healthy",
  "timestamp": 1697123456,
  "version": "1.0.0"
}
```

## 🔄 Updates

### Updating the Platform

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up --build -d

# Verify update
curl http://localhost:8080/api/v1/health
```

### Rolling Back

```bash
# Check git history
git log --oneline

# Rollback to previous version
git checkout <previous-commit>

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up --build -d
```

## 📞 Support

If you encounter issues during installation:

1. **Check the logs** first
2. **Search existing issues** on GitHub
3. **Create a new issue** with detailed information
4. **Join our Discord** for real-time help

---

**Next Steps**: After installation, check out our [Configuration Guide](./configuration.md) to customize your setup.
