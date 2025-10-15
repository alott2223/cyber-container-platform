#!/bin/bash

# Cyber Container Platform Development Setup Script

echo "🛠️ Setting up Cyber Container Platform for development..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check if Go is installed
if ! command -v go &> /dev/null; then
    echo "❌ Go is not installed. Please install Go 1.21+ and try again."
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "📦 Installing dependencies..."

# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..

# Install backend dependencies
cd backend
go mod tidy
cd ..

# Create data directory
mkdir -p data

# Create SSL certificates directory
mkdir -p certs

echo "🔐 Generating self-signed SSL certificates..."
openssl req -x509 -newkey rsa:4096 -keyout certs/server.key -out certs/server.crt -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

echo "✅ Development setup complete!"
echo ""
echo "🚀 To start development servers:"
echo "   npm run dev"
echo ""
echo "🌐 Frontend will be available at: http://localhost:3000"
echo "🔌 Backend API will be available at: http://localhost:8080"
echo "🔌 WebSocket will be available at: ws://localhost:8081/ws"
echo ""
echo "🔑 Default credentials: admin / admin"
