@echo off
echo 🚀 Starting Cyber Container Platform...

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker and try again.
    pause
    exit /b 1
)

REM Create data directory
if not exist data mkdir data

REM Set environment variables
set PORT=8080
set WS_PORT=8081
set DATABASE_PATH=./data/cyber.db
set JWT_SECRET=cyber-secret-key-change-in-production

echo 📦 Building and starting containers...
docker-compose up -d --build

echo ⏳ Waiting for services to start...
timeout /t 10 /nobreak >nul

REM Check if services are running
docker-compose ps | findstr "Up" >nul
if %errorlevel% equ 0 (
    echo ✅ Cyber Container Platform is running!
    echo.
    echo 🌐 Access the platform at: http://localhost:8080
    echo 🔑 Default credentials: admin / admin
    echo.
    echo 📊 API Documentation: http://localhost:8080/api/v1
    echo 🔌 WebSocket: ws://localhost:8081/ws
    echo.
    echo To stop the platform, run: docker-compose down
) else (
    echo ❌ Failed to start services. Check logs with: docker-compose logs
    pause
    exit /b 1
)

pause
