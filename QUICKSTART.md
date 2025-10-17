# 🚀 Quick Start Guide

Get Cyber Container Platform up and running in 5 minutes!

## ⚡ Prerequisites

- Docker Engine 20.10+ or Docker Desktop
- Git (for cloning the repository)
- 4GB RAM minimum
- 10GB free disk space

## 📦 Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/alott2223/cyber-container-platform.git
cd cyber-container-platform
```

### Step 2: Start the Application

**Option A: Using Docker Compose (Recommended)**
```bash
docker-compose up -d
```

**Option B: Development Mode**
```bash
# Start backend
cd backend
go run main.go

# In another terminal, start frontend
cd frontend
npm install
npm run dev
```

### Step 3: Access the Platform

Open your browser to: **http://localhost:3000**

**Login with:**
- Username: `admin`
- Password: `admin`

⚠️ **Important**: Change the default password immediately in Settings!

## 🎮 First Steps

### 1. View Containers
- Click on **Containers** in the sidebar
- See all running Docker containers
- Real-time status updates

### 2. Try the Terminal
- Click on **Terminal** in the sidebar
- Run command: `docker ps`
- See live Docker command execution

### 3. Create a Container
- Click **Create Container** button
- Fill in container details:
  - Name: `test-nginx`
  - Image: `nginx:alpine`
  - Ports: `8080` → `80`
- Click **Create**
- Watch your container start!

### 4. Monitor Metrics
- Click on **Metrics** in the sidebar
- View CPU, memory, and network usage
- Real-time charts and graphs

### 5. Manage Networks
- Click on **Networks** in the sidebar
- Create custom Docker networks
- View network topology

## 🎯 Common Tasks

### Create a Web Server
```bash
# In the Terminal tab
docker run -d --name my-web -p 8080:80 nginx:alpine
```

### View Container Logs
```bash
docker logs my-web
```

### Stop a Container
```bash
docker stop my-web
```

### Remove a Container
```bash
docker rm my-web
```

## 🔧 Configuration

### Change Port (if 3000 is in use)
```bash
# Edit docker-compose.yml
# Change frontend port mapping: "3001:3000"
```

### Enable SSL/TLS
```bash
# Edit backend/config/production.yaml
ssl_enabled: true
cert_path: "./certs/server.crt"
key_path: "./certs/server.key"
```

### Change JWT Secret
```bash
# Edit backend/config/production.yaml
security:
  jwt_secret: "your-super-secret-key-here"
```

## 🐛 Troubleshooting

### Docker Not Running
```bash
# Check Docker status
docker info

# Start Docker
# On Windows: Start Docker Desktop
# On Linux: sudo systemctl start docker
```

### Port Already in Use
```bash
# Find process using port 3000
# Windows: netstat -ano | findstr "3000"
# Linux: lsof -i :3000

# Kill the process or change the port
```

### Backend Connection Error
```bash
# Check if backend is running
curl http://localhost:8080/health

# Check logs
docker-compose logs backend
```

### Frontend Build Error
```bash
# Clear cache and rebuild
cd frontend
rm -rf .next node_modules
npm install
npm run dev
```

## 💡 Pro Tips

### Keyboard Shortcuts
- `Ctrl + 1-7`: Switch between tabs
- `↑/↓`: Navigate command history in terminal
- `Ctrl + K`: Quick search
- `Ctrl + R`: Refresh current view

### Terminal Tips
- Use `↑` arrow to recall previous commands
- Type `help` to see available commands
- Use `clear` to clean terminal output
- Tab completion coming soon!

### Performance Tips
- Enable auto-refresh in Settings
- Adjust refresh interval (default: 5 seconds)
- Use filters to reduce data load
- Close unused tabs to save resources

## 🎓 Next Steps

1. **Explore Features**: Try all tabs and features
2. **Read Documentation**: Check out [docs/](./docs/)
3. **Customize Settings**: Configure to your preferences
4. **Create Templates**: Save common container configurations
5. **Join Community**: Star ⭐ the repo and contribute!

## 📚 Learn More

- [Full Documentation](./README.md)
- [API Reference](./docs/api.md)
- [Configuration Guide](./docs/configuration.md)
- [Deployment Guide](./docs/deployment.md)
- [Keyboard Shortcuts](./docs/keyboard-shortcuts.md)

## 🆘 Getting Help

- **📖 Documentation**: Check the docs first
- **🐛 Issues**: Search [existing issues](https://github.com/alott2223/cyber-container-platform/issues)
- **💬 Discussions**: Ask in [GitHub Discussions](https://github.com/alott2223/cyber-container-platform/discussions)
- **☕ Support**: [Buy Me a Coffee](https://buymeacoffee.com/alott)

---

**Welcome to Cyber Container Platform!** 🎉

Made with ❤️ by [alott2223](https://github.com/alott2223)
