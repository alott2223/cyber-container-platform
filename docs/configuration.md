# ⚙️ Configuration Guide

This guide covers all configuration options available in Cyber Container Platform, from basic settings to advanced customization.

## 📁 Configuration Files

### Main Configuration Files

```
cyber-container-platform/
├── backend/config/
│   ├── production.yaml      # Production configuration
│   └── development.yaml    # Development configuration
├── frontend/
│   ├── next.config.js      # Next.js configuration
│   ├── tailwind.config.js  # Tailwind CSS configuration
│   └── .env.local          # Frontend environment variables
├── nginx/
│   └── nginx.conf          # Nginx configuration
└── docker-compose.yml      # Docker Compose configuration
```

## 🔧 Backend Configuration

### Main Configuration File (`backend/config/production.yaml`)

```yaml
# Server Configuration
server:
  port: 8080                    # Backend port
  host: "0.0.0.0"              # Bind address
  ssl_enabled: false           # Enable SSL/TLS
  ssl_cert: ""                 # SSL certificate path
  ssl_key: ""                  # SSL private key path

# Database Configuration
database:
  path: "./data/cyber-platform.db"  # SQLite database path

# Docker Configuration
docker:
  host: "unix:///var/run/docker.sock"  # Docker daemon socket
  api_version: "1.41"                  # Docker API version

# Security Configuration
security:
  jwt_secret: "your-super-secret-jwt-key-change-this-in-production"
  jwt_expiry: "24h"                    # JWT token expiration
  bcrypt_cost: 12                      # Password hashing cost
  max_login_attempts: 5                # Max failed login attempts
  lockout_duration: "15m"              # Account lockout duration

# Logging Configuration
logging:
  level: "info"                        # Log level (debug, info, warn, error)
  file: "./logs/cyber-platform.log"    # Log file path
  max_size: 100                        # Max log file size (MB)
  max_backups: 3                       # Number of backup files
  max_age: 28                          # Log retention (days)

# Rate Limiting
rate_limiting:
  requests_per_minute: 100              # API requests per minute
  burst_size: 20                        # Burst capacity

# Monitoring
monitoring:
  metrics_enabled: true                 # Enable metrics collection
  health_check_interval: "30s"         # Health check frequency
```

### Environment Variables

You can override configuration using environment variables:

```bash
# Server settings
export SERVER_PORT=8080
export SERVER_HOST=0.0.0.0
export SSL_ENABLED=false

# Database settings
export DB_PATH=/app/data/cyber-platform.db

# Security settings
export JWT_SECRET=your-secret-key
export JWT_EXPIRY=24h
export BCRYPT_COST=12

# Logging settings
export LOG_LEVEL=info
export LOG_FILE=/app/logs/cyber-platform.log
```

## 🎨 Frontend Configuration

### Next.js Configuration (`frontend/next.config.js`)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    appDir: true,
  },
  env: {
    API_URL: process.env.API_URL || 'http://localhost:8080',
    WS_URL: process.env.WS_URL || 'ws://localhost:8081',
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src'),
    }
    return config
  },
}

module.exports = nextConfig
```

### Tailwind Configuration (`frontend/tailwind.config.js`)

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'cyber-bg': '#0a0a0a',
        'cyber-surface': '#1a1a1a',
        'cyber-border': '#333333',
        'cyber-neon': '#00ffff',
        'cyber-accent': '#ff6b6b',
        'cyber-text': '#ffffff',
        'cyber-muted': '#666666',
      },
      fontFamily: {
        'cyber': ['Orbitron', 'monospace'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-neon': 'pulse-neon 2s ease-in-out infinite alternate',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        'pulse-neon': {
          '0%': { boxShadow: '0 0 5px #00ffff' },
          '100%': { boxShadow: '0 0 20px #00ffff, 0 0 30px #00ffff' },
        },
        'glow': {
          '0%': { textShadow: '0 0 5px #00ffff' },
          '100%': { textShadow: '0 0 20px #00ffff, 0 0 30px #00ffff' },
        },
      },
    },
  },
  plugins: [],
}
```

### Environment Variables (`frontend/.env.local`)

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8081

# Environment
NODE_ENV=production

# Feature Flags
NEXT_PUBLIC_ENABLE_TERMINAL=true
NEXT_PUBLIC_ENABLE_METRICS=true
NEXT_PUBLIC_ENABLE_NETWORKING=true
```

## 🌐 Nginx Configuration

### Main Configuration (`nginx/nginx.conf`)

```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;

    # Basic settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 100M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' ws: wss:;" always;

    # Upstream servers
    upstream backend {
        server backend:8080;
    }

    upstream frontend {
        server frontend:3000;
    }

    # Main server block
    server {
        listen 80;
        server_name localhost;

        # API routes
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # WebSocket support
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            
            # Timeouts
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # WebSocket endpoint
        location /ws {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Static files
        location /static/ {
            proxy_pass http://backend;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # Frontend routes
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # Handle client-side routing
            try_files $uri $uri/ @frontend;
        }

        location @frontend {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
```

## 🐳 Docker Configuration

### Development (`docker-compose.yml`)

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8080:8080"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./data:/app/data
    environment:
      - CONFIG_PATH=./config/development.yaml
      - GIN_MODE=debug
    networks:
      - cyber-platform

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
      - NEXT_PUBLIC_WS_URL=ws://localhost:8081
    networks:
      - cyber-platform

networks:
  cyber-platform:
    driver: bridge
```

### Production (`docker-compose.prod.yml`)

```yaml
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile.prod
    ports:
      - "8080:8080"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./data:/app/data
      - ./logs:/app/logs
    environment:
      - CONFIG_PATH=/app/config/production.yaml
      - GIN_MODE=release
    restart: unless-stopped
    networks:
      - cyber-platform
    depends_on:
      - frontend

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
      - NEXT_PUBLIC_WS_URL=ws://localhost:8081
    restart: unless-stopped
    networks:
      - cyber-platform

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - backend
      - frontend
    restart: unless-stopped
    networks:
      - cyber-platform

networks:
  cyber-platform:
    driver: bridge

volumes:
  data:
  logs:
```

## 🔐 Security Configuration

### SSL/TLS Setup

1. **Generate SSL Certificates**
   ```bash
   # Self-signed certificate (development)
   openssl req -x509 -newkey rsa:4096 -keyout nginx/ssl/key.pem -out nginx/ssl/cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
   
   # Let's Encrypt certificate (production)
   certbot certonly --standalone -d yourdomain.com
   ```

2. **Update Nginx Configuration**
   ```nginx
   server {
       listen 443 ssl http2;
       server_name yourdomain.com;
   
       ssl_certificate /etc/nginx/ssl/cert.pem;
       ssl_certificate_key /etc/nginx/ssl/key.pem;
       ssl_protocols TLSv1.2 TLSv1.3;
       ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
       ssl_prefer_server_ciphers off;
       ssl_session_cache shared:SSL:10m;
       ssl_session_timeout 10m;
   
       # Same location blocks as HTTP server
   }
   ```

### Firewall Configuration

```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Firewalld (CentOS/RHEL)
sudo firewall-cmd --permanent --add-port=22/tcp
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload
```

## 📊 Monitoring Configuration

### Prometheus Integration

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'cyber-platform'
    static_configs:
      - targets: ['localhost:8080']
    metrics_path: '/metrics'
    scrape_interval: 30s
```

### Grafana Dashboard

```json
{
  "dashboard": {
    "title": "Cyber Container Platform",
    "panels": [
      {
        "title": "Container Count",
        "type": "stat",
        "targets": [
          {
            "expr": "cyber_containers_total"
          }
        ]
      }
    ]
  }
}
```

## 🎨 Theme Customization

### Custom Color Scheme

```css
/* frontend/src/app/globals.css */
:root {
  --cyber-bg: #0a0a0a;
  --cyber-surface: #1a1a1a;
  --cyber-border: #333333;
  --cyber-neon: #00ffff;
  --cyber-accent: #ff6b6b;
  --cyber-text: #ffffff;
  --cyber-muted: #666666;
}

/* Dark theme */
[data-theme="dark"] {
  --cyber-bg: #000000;
  --cyber-surface: #111111;
  --cyber-border: #222222;
  --cyber-neon: #00ff00;
  --cyber-accent: #ff0080;
}

/* Light theme */
[data-theme="light"] {
  --cyber-bg: #ffffff;
  --cyber-surface: #f5f5f5;
  --cyber-border: #e0e0e0;
  --cyber-neon: #0066cc;
  --cyber-accent: #cc0066;
}
```

### Custom Fonts

```css
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=JetBrains+Mono:wght@300;400;500;700&display=swap');

.font-cyber {
  font-family: 'Orbitron', monospace;
}

.font-mono {
  font-family: 'JetBrains Mono', monospace;
}
```

## 🔄 Backup Configuration

### Automated Backup Script

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backup/cyber-platform"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
docker-compose -f docker-compose.prod.yml exec backend cp /app/data/cyber-platform.db /app/backup-${DATE}.db

# Backup configuration
cp -r backend/config $BACKUP_DIR/config-${DATE}
cp nginx/nginx.conf $BACKUP_DIR/nginx-${DATE}.conf

# Compress backup
tar -czf $BACKUP_DIR/cyber-platform-${DATE}.tar.gz $BACKUP_DIR/*-${DATE}*

# Cleanup old backups (keep last 7 days)
find $BACKUP_DIR -name "cyber-platform-*.tar.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/cyber-platform-${DATE}.tar.gz"
```

### Cron Job Setup

```bash
# Add to crontab
crontab -e

# Backup daily at 2 AM
0 2 * * * /path/to/backup.sh

# Backup weekly on Sunday at 3 AM
0 3 * * 0 /path/to/backup.sh
```

## 🚀 Performance Tuning

### Resource Limits

```yaml
# docker-compose.prod.yml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'
```

### Database Optimization

```sql
-- SQLite optimizations
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA cache_size = 1000;
PRAGMA temp_store = memory;
```

### Nginx Optimization

```nginx
# nginx.conf
worker_processes auto;
worker_connections 1024;

# Enable gzip compression
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_comp_level 6;

# Enable caching
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## 🔍 Troubleshooting

### Configuration Validation

```bash
# Validate Docker Compose configuration
docker-compose -f docker-compose.prod.yml config

# Validate Nginx configuration
nginx -t

# Check backend configuration
docker-compose -f docker-compose.prod.yml exec backend ./main --config-check
```

### Common Configuration Issues

1. **Port Conflicts**
   ```bash
   # Check port usage
   sudo netstat -tulpn | grep :8080
   sudo netstat -tulpn | grep :3000
   ```

2. **Permission Issues**
   ```bash
   # Fix Docker socket permissions
   sudo chmod 666 /var/run/docker.sock
   ```

3. **SSL Certificate Issues**
   ```bash
   # Check certificate validity
   openssl x509 -in nginx/ssl/cert.pem -text -noout
   ```

---

**Next Steps**: After configuration, check out our [Deployment Guide](./deployment.md) for production deployment.
