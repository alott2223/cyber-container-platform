#!/bin/bash

# Cyber Container Platform Deployment Script
set -e

echo "🚀 Starting Cyber Container Platform Deployment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose and try again."
    exit 1
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p data logs nginx/ssl

# Set proper permissions
echo "🔐 Setting proper permissions..."
chmod 755 data logs
chmod 644 nginx/nginx.conf

# Generate SSL certificates (self-signed for development)
if [ ! -f "nginx/ssl/cert.pem" ]; then
    echo "🔒 Generating self-signed SSL certificates..."
    openssl req -x509 -newkey rsa:4096 -keyout nginx/ssl/key.pem -out nginx/ssl/cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
    chmod 600 nginx/ssl/key.pem
    chmod 644 nginx/ssl/cert.pem
fi

# Build and start services
echo "🔨 Building and starting services..."
docker-compose -f docker-compose.prod.yml up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service health
echo "🏥 Checking service health..."
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "✅ Backend service is healthy"
else
    echo "❌ Backend service is not responding"
    docker-compose -f docker-compose.prod.yml logs backend
    exit 1
fi

if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend service is healthy"
else
    echo "❌ Frontend service is not responding"
    docker-compose -f docker-compose.prod.yml logs frontend
    exit 1
fi

# Display deployment information
echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📊 Service Information:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8080/api/v1"
echo "   Nginx Proxy: http://localhost"
echo "   Health Check: http://localhost/health"
echo ""
echo "🔧 Management Commands:"
echo "   View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "   Stop services: docker-compose -f docker-compose.prod.yml down"
echo "   Restart services: docker-compose -f docker-compose.prod.yml restart"
echo "   Update services: docker-compose -f docker-compose.prod.yml up --build -d"
echo ""
echo "🔐 Default Login Credentials:"
echo "   Username: admin"
echo "   Password: admin"
echo "   (Please change these in production!)"
echo ""
echo "📝 Next Steps:"
echo "   1. Change default admin credentials"
echo "   2. Configure SSL certificates for production"
echo "   3. Set up monitoring and logging"
echo "   4. Configure backup strategies"
echo ""
echo "🌟 Cyber Container Platform is now running!"
