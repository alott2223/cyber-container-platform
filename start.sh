#!/bin/bash

# Cyber Container Platform Startup Script

echo "🚀 Starting Cyber Container Platform..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Docker socket is accessible
if [ ! -S /var/run/docker.sock ]; then
    echo "❌ Docker socket not found. Please ensure Docker is properly installed."
    exit 1
fi

# Create data directory
mkdir -p data

# Set environment variables
export PORT=8080
export WS_PORT=8081
export DATABASE_PATH=./data/cyber.db
export JWT_SECRET=cyber-secret-key-change-in-production

echo "📦 Building and starting containers..."
docker-compose up -d --build

echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo "✅ Cyber Container Platform is running!"
    echo ""
    echo "🌐 Access the platform at: http://localhost:8080"
    echo "🔑 Default credentials: admin / admin"
    echo ""
    echo "📊 API Documentation: http://localhost:8080/api/v1"
    echo "🔌 WebSocket: ws://localhost:8081/ws"
    echo ""
    echo "To stop the platform, run: docker-compose down"
else
    echo "❌ Failed to start services. Check logs with: docker-compose logs"
    exit 1
fi
