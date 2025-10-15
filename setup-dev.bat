@echo off
echo 🛠️ Setting up Cyber Container Platform for development...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ and try again.
    pause
    exit /b 1
)

REM Check if Go is installed
go version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Go is not installed. Please install Go 1.21+ and try again.
    pause
    exit /b 1
)

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker and try again.
    pause
    exit /b 1
)

echo 📦 Installing dependencies...

REM Install root dependencies
npm install

REM Install frontend dependencies
cd frontend
npm install
cd ..

REM Install backend dependencies
cd backend
go mod tidy
cd ..

REM Create data directory
if not exist data mkdir data

REM Create SSL certificates directory
if not exist certs mkdir certs

echo 🔐 Generating self-signed SSL certificates...
openssl req -x509 -newkey rsa:4096 -keyout certs/server.key -out certs/server.crt -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

echo ✅ Development setup complete!
echo.
echo 🚀 To start development servers:
echo    npm run dev
echo.
echo 🌐 Frontend will be available at: http://localhost:3000
echo 🔌 Backend API will be available at: http://localhost:8080
echo 🔌 WebSocket will be available at: ws://localhost:8081/ws
echo.
echo 🔑 Default credentials: admin / admin

pause
