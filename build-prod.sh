#!/bin/bash

# Production Build Script for Cyber Container Platform
set -e

echo "🔨 Building Cyber Container Platform for Production..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Create build directory
echo "📁 Creating build directory..."
mkdir -p build

# Build backend
echo "🔧 Building backend..."
cd backend
go mod tidy
CGO_ENABLED=1 GOOS=linux go build -a -installsuffix cgo -o ../build/cyber-platform-backend .
cd ..

# Build frontend
echo "🎨 Building frontend..."
cd frontend
npm ci
npm run build
cd ..

# Copy necessary files to build directory
echo "📋 Copying configuration files..."
cp -r backend/config build/
cp -r nginx build/
cp docker-compose.prod.yml build/
cp deploy.sh build/
cp README-PRODUCTION.md build/

# Create production archive
echo "📦 Creating production archive..."
tar -czf cyber-container-platform-prod-$(date +%Y%m%d).tar.gz build/

echo "✅ Production build completed!"
echo "📦 Archive: cyber-container-platform-prod-$(date +%Y%m%d).tar.gz"
echo ""
echo "🚀 To deploy:"
echo "   1. Extract the archive on your production server"
echo "   2. Run: ./deploy.sh"
echo ""
echo "📋 Contents:"
echo "   - Backend binary"
echo "   - Frontend build"
echo "   - Configuration files"
echo "   - Deployment scripts"
echo "   - Documentation"
