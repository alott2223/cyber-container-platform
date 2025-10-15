@echo off
REM Cyber Container Platform Deployment Script for Windows
setlocal enabledelayedexpansion

echo 🚀 Starting Cyber Container Platform Deployment...

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker and try again.
    exit /b 1
)

REM Check if Docker Compose is available
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not installed. Please install Docker Compose and try again.
    exit /b 1
)

REM Create necessary directories
echo 📁 Creating necessary directories...
if not exist "data" mkdir data
if not exist "logs" mkdir logs
if not exist "nginx\ssl" mkdir nginx\ssl

REM Generate SSL certificates (self-signed for development)
if not exist "nginx\ssl\cert.pem" (
    echo 🔒 Generating self-signed SSL certificates...
    openssl req -x509 -newkey rsa:4096 -keyout nginx\ssl\key.pem -out nginx\ssl\cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
)

REM Build and start services
echo 🔨 Building and starting services...
docker-compose -f docker-compose.prod.yml up --build -d

REM Wait for services to be ready
echo ⏳ Waiting for services to be ready...
timeout /t 10 /nobreak >nul

REM Check service health
echo 🏥 Checking service health...
curl -f http://localhost/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend service is healthy
) else (
    echo ❌ Backend service is not responding
    docker-compose -f docker-compose.prod.yml logs backend
    exit /b 1
)

curl -f http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend service is healthy
) else (
    echo ❌ Frontend service is not responding
    docker-compose -f docker-compose.prod.yml logs frontend
    exit /b 1
)

REM Display deployment information
echo.
echo 🎉 Deployment completed successfully!
echo.
echo 📊 Service Information:
echo    Frontend: http://localhost:3000
echo    Backend API: http://localhost:8080/api/v1
echo    Nginx Proxy: http://localhost
echo    Health Check: http://localhost/health
echo.
echo 🔧 Management Commands:
echo    View logs: docker-compose -f docker-compose.prod.yml logs -f
echo    Stop services: docker-compose -f docker-compose.prod.yml down
echo    Restart services: docker-compose -f docker-compose.prod.yml restart
echo    Update services: docker-compose -f docker-compose.prod.yml up --build -d
echo.
echo 🔐 Default Login Credentials:
echo    Username: admin
echo    Password: admin
echo    (Please change these in production!)
echo.
echo 📝 Next Steps:
echo    1. Change default admin credentials
echo    2. Configure SSL certificates for production
echo    3. Set up monitoring and logging
echo    4. Configure backup strategies
echo.
echo 🌟 Cyber Container Platform is now running!
pause
