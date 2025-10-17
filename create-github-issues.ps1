# PowerShell script to create GitHub issues
# Note: This requires GitHub CLI (gh) to be installed

Write-Host "Creating GitHub issues for Cyber Container Platform..." -ForegroundColor Green

# Check if GitHub CLI is installed
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Host "GitHub CLI (gh) is not installed. Please install it first:" -ForegroundColor Red
    Write-Host "https://cli.github.com/" -ForegroundColor Yellow
    Write-Host "Or create issues manually using the templates in .github/ISSUE_TEMPLATE/" -ForegroundColor Yellow
    exit 1
}

# Create issues
Write-Host "Creating issue: Docker Daemon Connection Error" -ForegroundColor Cyan
gh issue create --title "Docker daemon not running - containers API returns 500 errors" --body "The backend is unable to connect to Docker daemon, causing all container-related API calls to fail with 500 errors.

**Error Message:**
\`\`\`
Failed to collect metrics: error during connect: this error may indicate that the docker daemon is not running: Get \"http://%2F%2F.%2Fpipe%2Fdocker_engine/v1.24/containers/json?all=1\": open //./pipe/docker_engine: The system cannot find the file specified.
\`\`\`

**Steps to Reproduce:**
1. Start the backend server
2. Login to the frontend
3. Navigate to Containers tab
4. Observe 500 errors in browser console

**Expected Behavior:**
- Backend should connect to Docker daemon
- Container list should display properly
- Terminal commands should work

**Environment:**
- OS: Windows 10
- Docker: Not installed/running
- Backend: Go server on port 8080
- Frontend: Next.js on port 3000

**Possible Solutions:**
- Install Docker Desktop
- Add Docker daemon connection fallback
- Implement mock data for development" --label "bug,docker,backend" --assignee "alott2223"

Write-Host "Creating issue: PowerShell Command Syntax Error" -ForegroundColor Cyan
gh issue create --title "PowerShell doesn't support \`&&\` operator in commands" --body "The README and documentation use bash-style \`&&\` operators which don't work in PowerShell.

**Error Message:**
\`\`\`
The token '&&' is not a valid statement separator in this version.
\`\`\`

**Steps to Reproduce:**
1. Open PowerShell
2. Run: \`cd frontend && npm run dev\`
3. Observe syntax error

**Expected Behavior:**
- Commands should work in PowerShell
- Documentation should be cross-platform

**Solution:**
- Update documentation with PowerShell syntax
- Provide both bash and PowerShell examples
- Use \`;\` instead of \`&&\` for PowerShell" --label "bug,windows,documentation" --assignee "alott2223"

Write-Host "Creating issue: Docker Installation Guide" -ForegroundColor Cyan
gh issue create --title "Add Docker installation and setup guide" --body "Add comprehensive Docker installation guide for different operating systems.

**Requirements:**
- Windows Docker Desktop installation
- Linux Docker installation
- macOS Docker installation
- Docker daemon configuration
- Troubleshooting common issues

**Acceptance Criteria:**
- [ ] Windows installation guide
- [ ] Linux installation guide
- [ ] macOS installation guide
- [ ] Docker daemon troubleshooting
- [ ] Development vs production setup" --label "enhancement,documentation,docker" --assignee "alott2223"

Write-Host "Creating issue: Mock Data Mode" -ForegroundColor Cyan
gh issue create --title "Implement mock data mode for development without Docker" --body "Add a mock data mode that allows developers to work on the platform without requiring Docker to be installed.

**Requirements:**
- Environment variable to enable mock mode
- Mock container data
- Mock network data
- Mock volume data
- Mock metrics data

**Acceptance Criteria:**
- [ ] \`MOCK_MODE=true\` environment variable
- [ ] Mock container list with sample data
- [ ] Mock network list
- [ ] Mock volume list
- [ ] Mock metrics data
- [ ] Terminal commands work with mock data" --label "enhancement,development,backend" --assignee "alott2223"

Write-Host "Creating issue: Enhanced Terminal Features" -ForegroundColor Cyan
gh issue create --title "Add command history and auto-completion to terminal" --body "Enhance the terminal with command history, auto-completion, and better UX.

**Requirements:**
- Command history (up/down arrows)
- Auto-completion for Docker commands
- Command suggestions
- Better error handling
- Syntax highlighting

**Acceptance Criteria:**
- [ ] Up/down arrow navigation through command history
- [ ] Tab completion for Docker commands
- [ ] Command suggestions dropdown
- [ ] Better error messages
- [ ] Syntax highlighting for commands" --label "enhancement,terminal,frontend" --assignee "alott2223"

Write-Host "Creating issue: API Documentation" -ForegroundColor Cyan
gh issue create --title "Create comprehensive API documentation" --body "Create detailed API documentation with examples and authentication details.

**Requirements:**
- OpenAPI/Swagger specification
- Authentication endpoints
- Container management endpoints
- Network management endpoints
- Volume management endpoints
- Error handling documentation

**Acceptance Criteria:**
- [ ] OpenAPI specification file
- [ ] Authentication documentation
- [ ] Container API documentation
- [ ] Network API documentation
- [ ] Volume API documentation
- [ ] Error codes and messages
- [ ] Example requests and responses" --label "documentation,api,backend" --assignee "alott2223"

Write-Host "Creating issue: Deployment Guide" -ForegroundColor Cyan
gh issue create --title "Create production deployment guide" --body "Create comprehensive guide for deploying the platform in production.

**Requirements:**
- Docker Compose deployment
- Environment variables configuration
- SSL/TLS setup
- Nginx reverse proxy configuration
- Database setup
- Monitoring setup

**Acceptance Criteria:**
- [ ] Docker Compose production setup
- [ ] Environment variables guide
- [ ] SSL certificate setup
- [ ] Nginx configuration
- [ ] Database initialization
- [ ] Monitoring configuration
- [ ] Security best practices" --label "documentation,deployment,production" --assignee "alott2223"

Write-Host "Creating issue: Responsive Design" -ForegroundColor Cyan
gh issue create --title "Improve responsive design for mobile devices" --body "Improve the responsive design to work better on mobile devices and tablets.

**Requirements:**
- Mobile-friendly navigation
- Responsive tables
- Touch-friendly buttons
- Mobile-optimized terminal
- Responsive charts

**Acceptance Criteria:**
- [ ] Mobile navigation menu
- [ ] Responsive data tables
- [ ] Touch-friendly interface
- [ ] Mobile terminal optimization
- [ ] Responsive charts and graphs
- [ ] Mobile testing" --label "enhancement,ui,responsive" --assignee "alott2223"

Write-Host "All issues created successfully!" -ForegroundColor Green
Write-Host "You can view them at: https://github.com/alott2223/cyber-container-platform/issues" -ForegroundColor Yellow
