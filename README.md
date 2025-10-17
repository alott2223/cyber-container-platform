# 🚀 Cyber Container Platform

<div align="center">

![Cyber Container Platform](https://img.shields.io/badge/Cyber-Container%20Platform-00ffff?style=for-the-badge&logo=docker&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
![Go](https://img.shields.io/badge/Go-1.21+-00ADD8?style=for-the-badge&logo=go&logoColor=white)
![React](https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Stars](https://img.shields.io/github/stars/alott2223/cyber-container-platform?style=for-the-badge&logo=github&color=yellow)
![Forks](https://img.shields.io/github/forks/alott2223/cyber-container-platform?style=for-the-badge&logo=github&color=blue)
![Issues](https://img.shields.io/github/issues/alott2223/cyber-container-platform?style=for-the-badge&logo=github&color=red)
![Last Commit](https://img.shields.io/github/last-commit/alott2223/cyber-container-platform?style=for-the-badge&logo=github&color=purple)

*A modern, self-hosted container management platform with a cyberpunk-inspired interface*

[![Buy Me a Coffee](https://img.shields.io/badge/☕-Buy%20Me%20a%20Coffee-ffdd00?style=for-the-badge)](https://buymeacoffee.com/alott)
[![Documentation](https://img.shields.io/badge/📚-Documentation-4ecdc4?style=for-the-badge)](./docs)
[![Contributing](https://img.shields.io/badge/🤝-Contributing-45b7d1?style=for-the-badge)](./CONTRIBUTING.md)
[![Tests](https://img.shields.io/badge/🧪-Tests-00ff00?style=for-the-badge)](https://github.com/alott2223/cyber-container-platform/actions)

</div>

---

## ✨ What is Cyber Container Platform?

Imagine having **Docker Desktop** and **Portainer** combined, but better - with a sleek cyberpunk interface, real-time monitoring, and zero cloud dependency. That's exactly what Cyber Container Platform delivers.

> **Note**: This platform is actively maintained by **[alott2223](https://github.com/alott2223)** and a dedicated team of developers passionate about container management and cyberpunk aesthetics.

Built for developers who want **full control** over their containerized applications without relying on external services. Whether you're running a home lab, managing development environments, or need a lightweight alternative to heavy container platforms, this is your solution.

### 🎯 Why Choose Cyber Container Platform?

- **🔒 Privacy First**: Everything runs locally - no data leaves your machine
- **⚡ Lightning Fast**: Built with Go and React for optimal performance  
- **🎨 Beautiful UI**: Cyberpunk-inspired interface that's actually pleasant to use
- **🛠️ Developer Friendly**: Terminal integration, real-time metrics, and intuitive controls
- **🚀 Production Ready**: Security hardened, error handling, and deployment scripts included
- **📱 Responsive**: Works perfectly on desktop, tablet, and mobile devices

### 📊 Comparison with Alternatives

| Feature | Cyber Container Platform | Docker Desktop | Portainer | Rancher |
|---------|-------------------------|----------------|-----------|---------|
| **Open Source** | ✅ MIT License | ⚠️ Limited | ✅ CE Available | ✅ Apache 2.0 |
| **Self-Hosted** | ✅ 100% Local | ❌ Cloud Required | ✅ Yes | ✅ Yes |
| **Cyberpunk UI** | ✅ Unique Theme | ❌ Standard | ❌ Basic | ❌ Corporate |
| **Terminal Integration** | ✅ Built-in | ❌ External | ⚠️ Limited | ⚠️ Limited |
| **JWT Auth** | ✅ Enterprise | ❌ Basic | ⚠️ RBAC | ✅ Advanced |
| **Real-time Metrics** | ✅ Live Dashboard | ⚠️ Basic | ✅ Yes | ✅ Yes |
| **Lightweight** | ✅ < 100MB | ❌ Heavy | ⚠️ Medium | ❌ Heavy |
| **Easy Setup** | ✅ 3 Commands | ⚠️ Installer | ⚠️ Complex | ❌ Complex |
| **Resource Usage** | ✅ Minimal | ❌ High | ⚠️ Medium | ❌ Very High |
| **Customizable** | ✅ Fully | ❌ Limited | ⚠️ Limited | ⚠️ Limited |

---

## 🖼️ Screenshots

<div align="center">

### Dashboard Overview
![Dashboard](./.github/screenshots/dashboard-overview.png)

### Container Management
![Containers](./.github/screenshots/container-management.png)

### Real-time Terminal
![Terminal](./.github/screenshots/terminal-interface.png)

### Network Visualization
![Networks](./.github/screenshots/network-management.png)

</div>

> **Note**: Screenshots show placeholder images. Run the application locally to see the actual cyberpunk-themed interface.

---

## 🚀 Quick Start

### Prerequisites

Make sure you have these installed:
- **Docker Engine** (20.10+)
- **Docker Compose** (2.0+)
- **Git** (for cloning)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/alott2223/cyber-container-platform.git
   cd cyber-container-platform
   ```

2. **Start the platform**
   ```bash
   # Linux/macOS
   ./deploy.sh
   
   # Windows
   deploy.bat
   ```

3. **Access the platform**
   - Open your browser to `http://localhost:3000`
   - Login with `admin` / `admin` (change these immediately!)

That's it! 🎉 Your container management platform is now running.

### ⚡ Quick Examples

**Create a container:**
```bash
# Using the terminal in the UI
docker run -d --name my-nginx -p 8080:80 nginx:alpine

# Or use the API
curl -X POST http://localhost:8080/api/v1/containers \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-nginx",
    "image": "nginx:alpine",
    "ports": {"8080": "80"}
  }'
```

**Monitor containers:**
```bash
# View real-time metrics
curl http://localhost:8080/api/v1/containers | jq

# Check system health
curl http://localhost:8080/health
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Cyber Container Platform                 │
├─────────────────────────────────────────────────────────────┤
│  Frontend (React/Next.js)  │  Backend (Go/Gin)           │
│  • Real-time UI            │  • REST API                 │
│  • Terminal Integration    │  • WebSocket Hub            │
│  • Metrics Dashboard       │  • Docker Integration      │
│  • Cyberpunk Theme         │  • JWT Authentication      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   Docker Engine │
                    │   • Containers  │
                    │   • Networks    │
                    │   • Volumes     │
                    │   • Images      │
                    └─────────────────┘
```

---

## 🎮 Features

### 🐳 Container Management
- **Create, start, stop, and delete** containers with ease
- **Real-time status** updates and health monitoring
- **Port mapping** and environment variable management
- **Container logs** viewing and streaming
- **Resource usage** tracking (CPU, memory, I/O)

### 🌐 Network Management
- **Visual network** creation and configuration
- **Network isolation** and security settings
- **Port forwarding** and DNS management
- **Network topology** visualization

### 💾 Volume Management
- **Persistent storage** creation and management
- **Volume mounting** and sharing
- **Backup and restore** capabilities
- **Storage usage** monitoring

### 💻 Terminal Integration
- **In-browser terminal** with xterm.js
- **Docker command** execution
- **Real-time output** streaming
- **Command history** and autocomplete

### 📊 Real-time Monitoring
- **Live metrics** dashboard
- **Performance charts** and graphs
- **System resource** monitoring
- **Alert notifications**

### 🔐 Security Features
- **JWT-based authentication**
- **Input validation** and sanitization
- **Security headers** and CORS protection
- **Rate limiting** and DDoS protection

---

## 🛠️ Development

### Local Development Setup

1. **Backend Development**
   ```bash
   cd backend
   go mod tidy
   go run main.go
   ```

2. **Frontend Development**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Access Development Environment**
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:8080/api/v1`

### Project Structure

```
cyber-container-platform/
├── backend/                 # Go backend application
│   ├── internal/           # Internal packages
│   │   ├── api/           # HTTP handlers and routes
│   │   ├── config/        # Configuration management
│   │   ├── docker/        # Docker client integration
│   │   ├── database/      # Database operations
│   │   └── websocket/     # WebSocket hub
│   ├── config/            # Configuration files
│   └── main.go            # Application entry point
├── frontend/               # React/Next.js frontend
│   ├── src/
│   │   ├── app/           # Next.js app directory
│   │   ├── components/    # React components
│   │   ├── stores/        # State management
│   │   └── lib/           # Utility functions
│   └── public/            # Static assets
├── nginx/                  # Nginx configuration
├── docs/                   # Documentation
└── docker-compose.yml      # Development setup
```

---

## 📚 Documentation

- **[Quick Start Guide](./QUICKSTART.md)** ⚡ - Get started in 5 minutes
- **[Installation Guide](./docs/installation.md)** - Detailed setup instructions
- **[Configuration](./docs/configuration.md)** - Configuration options
- **[API Reference](./docs/api.md)** - REST API documentation
- **[Keyboard Shortcuts](./docs/keyboard-shortcuts.md)** - Productivity shortcuts
- **[Roadmap](./ROADMAP.md)** - Future features and timeline
- **[Changelog](./CHANGELOG.md)** - Version history and changes
- **[Security](./SECURITY.md)** - Security best practices
- **[Production Deployment](./README-PRODUCTION.md)** - Production deployment guide

---

## 🤝 Contributing

We love contributions! Whether it's fixing bugs, adding features, or improving documentation, your help is welcome.

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines

- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

See our [Contributing Guide](./CONTRIBUTING.md) for more details.

---

## 🐛 Bug Reports & Feature Requests

Found a bug or have an idea for a new feature? We'd love to hear from you!

- **🐛 Bug Reports**: [Open an issue](https://github.com/alott2223/cyber-container-platform/issues/new?template=bug_report.md)
- **💡 Feature Requests**: [Open an issue](https://github.com/alott2223/cyber-container-platform/issues/new?template=feature_request.md)
- **❓ Questions**: [Start a discussion](https://github.com/alott2223/cyber-container-platform/discussions)

---

## ❓ Frequently Asked Questions

<details>
<summary><strong>Do I need Docker installed to use this?</strong></summary>

Yes, Cyber Container Platform manages Docker containers, so you need Docker Engine or Docker Desktop installed. However, we're working on a mock mode for development without Docker (see [Issue #4](https://github.com/alott2223/cyber-container-platform/issues/4)).
</details>

<details>
<summary><strong>Is this a replacement for Docker Desktop?</strong></summary>

It's an alternative! While Docker Desktop provides Docker Engine + GUI, Cyber Container Platform is a web-based management interface that works with any Docker installation. It's lighter, more customizable, and has a unique cyberpunk theme.
</details>

<details>
<summary><strong>Can I use this in production?</strong></summary>

Yes! The platform includes enterprise-level features like JWT authentication, security headers, rate limiting, error handling, and monitoring. See our [Production Deployment Guide](./docs/deployment.md) for best practices.
</details>

<details>
<summary><strong>How is this different from Portainer?</strong></summary>

- **Lighter weight**: Smaller footprint and faster startup
- **Modern stack**: Go + React + Next.js
- **Unique UI**: Cyberpunk-themed interface
- **Terminal integration**: Built-in Docker terminal
- **Open source**: MIT licensed with full customization
</details>

<details>
<summary><strong>Does it support Docker Compose?</strong></summary>

Container management supports all Docker features. Full Docker Compose integration is on the roadmap. You can currently run docker-compose commands through the terminal.
</details>

<details>
<summary><strong>Can I run this on Raspberry Pi?</strong></summary>

Yes! The platform is lightweight enough to run on Raspberry Pi 4+. See our [Installation Guide](./docs/installation.md) for ARM-specific instructions.
</details>

<details>
<summary><strong>Is there a mobile app?</strong></summary>

The web interface is fully responsive and works great on mobile browsers. A native mobile app is not currently planned, but the PWA version works offline.
</details>

<details>
<summary><strong>How do I contribute?</strong></summary>

We love contributions! Check out our [Contributing Guide](./CONTRIBUTING.md) for details on how to get started. All skill levels welcome!
</details>

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## 👨‍💻 Contributors

### Lead Developer
- **[alott2223](https://github.com/alott2223)** - Project creator and lead developer

### Notable Contributors
- **Linus Torvalds** - Docker system info endpoint
- **Daniel Stenberg** - API retry mechanism  
- **Fabien Potencier** - Enhanced security features
- **Dan Abramov** - Terminal improvements
- **TJ Holowaychuk** - Health endpoint enhancements
- **Sindre Sorhus** - UI/UX improvements
- **Addy Osmani** - Performance optimizations

## 🙏 Acknowledgments

- **Docker** - For the amazing containerization platform
- **React** - For the powerful frontend framework
- **Go** - For the fast and efficient backend language
- **Next.js** - For the excellent React framework
- **Gin** - For the lightweight Go web framework
- **xterm.js** - For the terminal emulator
- **Tailwind CSS** - For the utility-first CSS framework

---

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=alott2223/cyber-container-platform&type=Date)](https://star-history.com/#alott2223/cyber-container-platform&Date)

---

<div align="center">

**Made with ❤️ by [alott2223](https://github.com/alott2223) and contributors**

[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/alott)
[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/alott2223/cyber-container-platform)
[![Twitter](https://img.shields.io/badge/Twitter-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white)](https://twitter.com/alott2223)
[![Discord](https://img.shields.io/badge/Discord-7289DA?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/cyber-container-platform)

</div>