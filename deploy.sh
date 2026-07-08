#!/bin/bash

# Cyber Container Platform - Production Deployment Script
set -e

echo "🚀 Starting Cyber Container Platform Deployment..."

if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null 2>&1; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose and try again."
    exit 1
fi

COMPOSE_CMD="docker-compose"
if ! command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker compose"
fi

echo "📁 Creating necessary directories..."
mkdir -p data logs nginx/ssl

echo "🔐 Setting proper permissions..."
chmod 755 data logs
chmod 644 nginx/nginx.conf

if [ ! -f ".env" ]; then
    echo "🔑 Generating production environment file..."
    JWT_SECRET=$(openssl rand -hex 32)
    ADMIN_PASSWORD=$(openssl rand -base64 18 | tr -dc 'A-Za-z0-9!@#$%^&*' | head -c 16)
    ADMIN_PASSWORD="${ADMIN_PASSWORD}Aa1!"

    cp .env.example .env
    sed -i "s|^JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET}|" .env
    sed -i "s|^ADMIN_PASSWORD=.*|ADMIN_PASSWORD=${ADMIN_PASSWORD}|" .env
    sed -i "s|^ENVIRONMENT=.*|ENVIRONMENT=production|" .env

    echo ""
    echo "============================================================"
    echo "  Production credentials generated (saved to .env):"
    echo "  Username: admin"
    echo "  Password: ${ADMIN_PASSWORD}"
    echo "  Change this password after first login."
    echo "============================================================"
    echo ""
else
    echo "ℹ️  Using existing .env file"
    if ! grep -q "^JWT_SECRET=.\+" .env; then
        echo "❌ JWT_SECRET is not set in .env. Generate one with: openssl rand -hex 32"
        exit 1
    fi
    if ! grep -q "^ADMIN_PASSWORD=.\+" .env; then
        echo "❌ ADMIN_PASSWORD is not set in .env."
        exit 1
    fi
fi

if [ ! -f "nginx/ssl/cert.pem" ]; then
    echo "🔒 Generating self-signed SSL certificates..."
    openssl req -x509 -newkey rsa:4096 -keyout nginx/ssl/key.pem -out nginx/ssl/cert.pem -days 365 -nodes \
        -subj "/C=US/ST=State/L=City/O=CyberContainer/CN=localhost"
    chmod 600 nginx/ssl/key.pem
    chmod 644 nginx/ssl/cert.pem
fi

echo "🔨 Building and starting services..."
$COMPOSE_CMD -f docker-compose.prod.yml up --build -d

echo "⏳ Waiting for services to be ready..."
sleep 15

echo "🏥 Checking service health..."
if curl -sf http://localhost:8080/health > /dev/null 2>&1; then
    echo "✅ Backend service is healthy"
else
    echo "❌ Backend service is not responding"
    $COMPOSE_CMD -f docker-compose.prod.yml logs backend
    exit 1
fi

if curl -sf http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend service is healthy"
else
    echo "❌ Frontend service is not responding"
    $COMPOSE_CMD -f docker-compose.prod.yml logs frontend
    exit 1
fi

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📊 Service Information:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8080/api/v1"
echo "   Nginx Proxy: http://localhost"
echo "   Health Check: http://localhost:8080/health"
echo ""
echo "🔧 Management Commands:"
echo "   View logs: $COMPOSE_CMD -f docker-compose.prod.yml logs -f"
echo "   Stop services: $COMPOSE_CMD -f docker-compose.prod.yml down"
echo "   Restart services: $COMPOSE_CMD -f docker-compose.prod.yml restart"
echo ""
echo "🔐 Login credentials are stored in .env (ADMIN_USERNAME / ADMIN_PASSWORD)"
echo ""
echo "📝 Next Steps:"
echo "   1. Change the admin password after first login"
echo "   2. Configure SSL certificates for production"
echo "   3. Review ALLOWED_ORIGINS in .env"
echo "   4. Set up monitoring and backup strategies"
echo ""
echo "🌟 Cyber Container Platform is now running!"
