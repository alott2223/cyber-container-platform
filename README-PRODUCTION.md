# Cyber Container Platform - Production Deployment Guide

A modern, self-hosted container management platform with a cyberpunk-inspired interface.

## Quick Start

### Prerequisites
- Docker Engine 20.10+
- Docker Compose 2.0+
- 4GB RAM minimum
- 10GB disk space

### Deployment

```bash
chmod +x deploy.sh
./deploy.sh
```

The deploy script automatically:
- Generates a `.env` file with secure `JWT_SECRET` and `ADMIN_PASSWORD` if one does not exist
- Creates SSL certificates for nginx
- Builds and starts all services with health checks

### Manual Deployment

```bash
cp .env.example .env
# Edit .env and set JWT_SECRET and ADMIN_PASSWORD

docker-compose -f docker-compose.prod.yml up --build -d
curl http://localhost:8080/health
```

## Security Requirements

Production deployments **require** the following environment variables:

| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | Minimum 32 characters. Generate with `openssl rand -hex 32` |
| `ADMIN_PASSWORD` | Minimum 12 characters with uppercase, lowercase, number, and special character |
| `ENVIRONMENT` | Set to `production` |
| `ALLOW_REGISTRATION` | Keep `false` unless you need open signup |

### Authentication

- Database-backed user accounts with bcrypt password hashing
- Login rate limiting and account lockout after failed attempts
- Audit logging for authentication events
- Password change required after first-run auto-generated credentials
- JWT tokens with configurable expiry

### Default Behavior

- Registration is **disabled** by default
- On first run (development), a secure admin password is auto-generated and printed to server logs
- In production, you must set `ADMIN_PASSWORD` before starting the server

## Configuration

See `.env.example` for all available options including:
- `ALLOWED_ORIGINS` - CORS configuration
- `MAX_LOGIN_ATTEMPTS` / `LOCKOUT_DURATION` - Brute force protection
- `JWT_EXPIRY` - Token lifetime
- `BCRYPT_COST` - Password hashing strength

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Health check with database and Docker status |
| `POST /api/v1/auth/login` | Authenticate |
| `POST /api/v1/auth/change-password` | Change password (authenticated) |
| `GET /api/v1/auth/profile` | Get current user profile |

## Health Checks

The health endpoint returns:
- `healthy` - All systems operational
- `degraded` - Docker unavailable but database OK
- `unhealthy` - Database unavailable

## Post-Deployment Checklist

1. Log in with credentials from `.env`
2. Change the admin password in Settings
3. Configure production SSL certificates in `nginx/ssl/`
4. Update `ALLOWED_ORIGINS` in `.env` for your domain
5. Set up log rotation and database backups for `./data/`
6. Review audit logs in the SQLite database


## 📊 Service Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Nginx       │    │    Frontend    │    │    Backend      │
│   (Port 80)     │────│   (Port 3000)  │────│   (Port 8080)   │
│   Load Balancer │    │   Next.js      │    │   Go API        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 Configuration

### Environment Variables

#### Backend
- `CONFIG_PATH`: Path to configuration file
- `GIN_MODE`: Gin mode (release for production)
- `JWT_SECRET`: JWT signing secret
- `DB_PATH`: Database file path

#### Frontend
- `NODE_ENV`: Node environment (production)
- `NEXT_PUBLIC_API_URL`: Backend API URL
- `NEXT_PUBLIC_WS_URL`: WebSocket URL

### Configuration Files

#### Production Config (`backend/config/production.yaml`)
```yaml
server:
  port: 8080
  host: "0.0.0.0"
  ssl_enabled: false

security:
  jwt_secret: "your-super-secret-jwt-key"
  jwt_expiry: "24h"
  bcrypt_cost: 12

logging:
  level: "info"
  file: "./logs/cyber-platform.log"
```

## 🔐 Security Features

### Implemented Security Measures
- ✅ JWT Authentication
- ✅ Input Validation & Sanitization
- ✅ Security Headers (CSP, XSS Protection)
- ✅ Rate Limiting
- ✅ CORS Configuration
- ✅ Non-root Container Users
- ✅ SSL/TLS Support

### Security Headers
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'
```

## 📈 Monitoring & Health Checks

### Health Endpoints
- `GET /health` - Backend health check
- `GET /api/v1/health` - API health check

### Health Check Response
```json
{
  "status": "healthy",
  "timestamp": 1697123456,
  "version": "1.0.0"
}
```

### Logging
- Application logs: `./logs/cyber-platform.log`
- Nginx logs: Docker container logs
- Log rotation: 100MB max, 3 backups, 28 days retention

## 🛠️ Management Commands

### Service Management
```bash
# Start services
docker-compose -f docker-compose.prod.yml up -d

# Stop services
docker-compose -f docker-compose.prod.yml down

# Restart services
docker-compose -f docker-compose.prod.yml restart

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Update services
docker-compose -f docker-compose.prod.yml up --build -d
```

### Database Management
```bash
# Backup database
docker-compose -f docker-compose.prod.yml exec backend cp /app/data/cyber-platform.db /app/backup-$(date +%Y%m%d).db

# Restore database
docker-compose -f docker-compose.prod.yml exec backend cp /app/backup-20231015.db /app/data/cyber-platform.db
```

## 🔒 SSL/TLS Configuration

### Self-Signed Certificates (Development)
```bash
# Generate certificates
openssl req -x509 -newkey rsa:4096 -keyout nginx/ssl/key.pem -out nginx/ssl/cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

### Production SSL Setup
1. Obtain certificates from a trusted CA
2. Place certificates in `nginx/ssl/`
3. Update `nginx/nginx.conf` to enable HTTPS
4. Redirect HTTP to HTTPS

## 📊 Performance Optimization

### Resource Limits
```yaml
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

### Caching
- Static files: 1 year cache
- API responses: No cache
- Frontend assets: Immutable cache

## 🚨 Troubleshooting

### Common Issues

#### Services Not Starting
```bash
# Check Docker status
docker info

# Check service logs
docker-compose -f docker-compose.prod.yml logs

# Check port conflicts
netstat -tulpn | grep :80
netstat -tulpn | grep :3000
netstat -tulpn | grep :8080
```

#### Database Issues
```bash
# Check database file permissions
ls -la data/cyber-platform.db

# Reset database
rm data/cyber-platform.db
docker-compose -f docker-compose.prod.yml restart backend
```

#### SSL Certificate Issues
```bash
# Check certificate validity
openssl x509 -in nginx/ssl/cert.pem -text -noout

# Regenerate certificates
rm nginx/ssl/*
openssl req -x509 -newkey rsa:4096 -keyout nginx/ssl/key.pem -out nginx/ssl/cert.pem -days 365 -nodes
```

### Log Analysis
```bash
# View application logs
tail -f logs/cyber-platform.log

# View Docker logs
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f nginx
```

## 🔄 Backup & Recovery

### Automated Backup Script
```bash
#!/bin/bash
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

echo "Backup completed: $BACKUP_DIR/cyber-platform-${DATE}.tar.gz"
```

### Recovery Process
```bash
# Stop services
docker-compose -f docker-compose.prod.yml down

# Restore database
tar -xzf cyber-platform-20231015.tar.gz
cp backup-20231015.db data/cyber-platform.db

# Restore configuration
cp config-20231015/* backend/config/
cp nginx-20231015.conf nginx/nginx.conf

# Start services
docker-compose -f docker-compose.prod.yml up -d
```

## 📋 Production Checklist

### Pre-Deployment
- [ ] Change default admin credentials
- [ ] Configure SSL certificates
- [ ] Set up monitoring
- [ ] Configure backups
- [ ] Test disaster recovery
- [ ] Review security settings
- [ ] Set resource limits
- [ ] Configure log rotation

### Post-Deployment
- [ ] Verify all services are running
- [ ] Test health endpoints
- [ ] Verify SSL certificates
- [ ] Test backup procedures
- [ ] Monitor resource usage
- [ ] Set up alerts
- [ ] Document access procedures

## 🆘 Support

### Getting Help
- Check logs first: `docker-compose -f docker-compose.prod.yml logs`
- Verify configuration: `docker-compose -f docker-compose.prod.yml config`
- Test connectivity: `curl http://localhost/health`

### Emergency Procedures
```bash
# Emergency stop
docker-compose -f docker-compose.prod.yml down

# Emergency restart
docker-compose -f docker-compose.prod.yml up -d

# Emergency backup
docker-compose -f docker-compose.prod.yml exec backend cp /app/data/cyber-platform.db /app/emergency-backup.db
```

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Go Documentation](https://golang.org/doc/)
- [Next.js Documentation](https://nextjs.org/docs)

---

**⚠️ Security Notice**: This platform manages Docker containers and has access to your Docker daemon. Ensure proper network security, firewall configuration, and access controls in production environments.

**🔒 Production Security**: Always change default credentials, use proper SSL certificates, and implement additional security measures based on your organization's requirements.
