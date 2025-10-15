# 🤝 Contributing to Cyber Container Platform

Thank you for your interest in contributing to Cyber Container Platform! We welcome contributions from developers of all skill levels.

## 🚀 Getting Started

### Prerequisites

Before you start contributing, make sure you have:

- **Docker** and **Docker Compose** installed
- **Go 1.21+** (for backend development)
- **Node.js 18+** (for frontend development)
- **Git** for version control

### Setting Up Your Development Environment

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/yourusername/cyber-container-platform.git
   cd cyber-container-platform
   ```

2. **Start the development environment**
   ```bash
   # Start backend
   cd backend
   go mod tidy
   go run main.go
   
   # In another terminal, start frontend
   cd frontend
   npm install
   npm run dev
   ```

3. **Verify everything is working**
   - Backend: `http://localhost:8080/api/v1/health`
   - Frontend: `http://localhost:3000`

## 🎯 How to Contribute

### 🐛 Bug Fixes

1. **Find an issue** that you'd like to work on
2. **Comment on the issue** to let us know you're working on it
3. **Create a branch** from `main`: `git checkout -b fix/issue-description`
4. **Make your changes** and test thoroughly
5. **Submit a pull request** with a clear description

### ✨ New Features

1. **Open an issue** to discuss your feature idea
2. **Wait for approval** from maintainers
3. **Create a branch**: `git checkout -b feature/feature-name`
4. **Implement your feature** with tests
5. **Update documentation** as needed
6. **Submit a pull request**

### 📚 Documentation Improvements

- Fix typos and grammar
- Improve code examples
- Add missing documentation
- Update installation guides
- Translate documentation

### 🎨 UI/UX Improvements

- Improve the cyberpunk theme
- Add animations and transitions
- Enhance mobile responsiveness
- Fix accessibility issues
- Improve user experience

## 📋 Pull Request Guidelines

### Before Submitting

- [ ] **Test your changes** thoroughly
- [ ] **Follow the code style** (see below)
- [ ] **Add tests** for new functionality
- [ ] **Update documentation** if needed
- [ ] **Ensure all tests pass**
- [ ] **Rebase your branch** on the latest main

### Pull Request Template

When creating a pull request, please include:

```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] UI/UX improvement
- [ ] Performance improvement
- [ ] Security enhancement

## Testing
- [ ] I have tested these changes locally
- [ ] I have added tests for new functionality
- [ ] All existing tests pass

## Screenshots (if applicable)
Add screenshots to help explain your changes.

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code where necessary
- [ ] I have made corresponding changes to documentation
```

## 🎨 Code Style Guidelines

### Go (Backend)

- Use `gofmt` for formatting
- Follow Go naming conventions
- Add comments for exported functions
- Use meaningful variable names
- Handle errors explicitly

```go
// Good
func CreateContainer(name string, image string) (*Container, error) {
    if name == "" {
        return nil, errors.New("container name cannot be empty")
    }
    
    container := &Container{
        Name:  name,
        Image: image,
    }
    
    return container, nil
}
```

### TypeScript/React (Frontend)

- Use TypeScript for type safety
- Follow React best practices
- Use functional components with hooks
- Add PropTypes or TypeScript interfaces
- Use meaningful component names

```tsx
// Good
interface ContainerCardProps {
  container: Container;
  onStart: (id: string) => void;
  onStop: (id: string) => void;
}

export function ContainerCard({ container, onStart, onStop }: ContainerCardProps) {
  const handleStart = useCallback(() => {
    onStart(container.id);
  }, [container.id, onStart]);

  return (
    <div className="cyber-card">
      <h3>{container.name}</h3>
      <button onClick={handleStart}>Start</button>
    </div>
  );
}
```

### CSS/Styling

- Use Tailwind CSS utility classes
- Follow the cyberpunk theme
- Use consistent spacing and colors
- Make components responsive

```css
/* Good */
.cyber-card {
  @apply bg-gray-900 border border-cyber-border rounded-lg p-6;
  @apply hover:border-cyber-neon transition-colors duration-300;
}
```

## 🧪 Testing

### Backend Testing

```bash
# Run all tests
go test ./...

# Run tests with coverage
go test -cover ./...

# Run specific test
go test ./internal/api -v
```

### Frontend Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Integration Testing

```bash
# Start test environment
docker-compose -f docker-compose.test.yml up -d

# Run integration tests
npm run test:integration

# Cleanup
docker-compose -f docker-compose.test.yml down
```

## 🐛 Reporting Issues

### Bug Reports

When reporting bugs, please include:

1. **Clear description** of the issue
2. **Steps to reproduce** the problem
3. **Expected behavior** vs actual behavior
4. **Screenshots** or error messages
5. **Environment details** (OS, Docker version, etc.)

### Feature Requests

For feature requests, please include:

1. **Clear description** of the feature
2. **Use case** and why it's needed
3. **Proposed implementation** (if you have ideas)
4. **Alternatives** you've considered

## 🏷️ Issue Labels

We use labels to categorize issues:

- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Improvements to documentation
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention is needed
- `priority: high` - Urgent issues
- `priority: medium` - Important but not urgent
- `priority: low` - Nice to have

## 📞 Getting Help

### Community Channels

- **GitHub Discussions** - For questions and general discussion
- **GitHub Issues** - For bug reports and feature requests
- **Discord** - For real-time chat and support

### Code Review Process

1. **Automated checks** must pass (tests, linting, etc.)
2. **At least one maintainer** must approve
3. **All conversations** must be resolved
4. **Branch must be up to date** with main

## 🎉 Recognition

Contributors will be recognized in:

- **README.md** - Contributors section
- **Release notes** - For significant contributions
- **GitHub contributors** - Automatic recognition

## 📜 Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors. Please read our [Code of Conduct](./CODE_OF_CONDUCT.md) for details.

## 🚀 Release Process

### Versioning

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR** - Breaking changes
- **MINOR** - New features (backward compatible)
- **PATCH** - Bug fixes (backward compatible)

### Release Schedule

- **Major releases** - Every 6 months
- **Minor releases** - Every 2 months
- **Patch releases** - As needed for bug fixes

## 💡 Ideas for Contributions

### Beginner-Friendly

- Fix typos in documentation
- Improve error messages
- Add loading states to UI
- Improve mobile responsiveness
- Add tooltips and help text

### Intermediate

- Add new container management features
- Improve the terminal experience
- Add more monitoring metrics
- Enhance the cyberpunk theme
- Add keyboard shortcuts

### Advanced

- Implement container orchestration
- Add support for Kubernetes
- Build a plugin system
- Add advanced security features
- Implement distributed deployment

## 🔧 Development Tools

### Recommended VS Code Extensions

- **Go** - Go language support
- **TypeScript and JavaScript** - TS/JS support
- **Tailwind CSS IntelliSense** - Tailwind support
- **Docker** - Docker support
- **GitLens** - Git supercharged

### Useful Commands

```bash
# Format Go code
go fmt ./...

# Lint Go code
golangci-lint run

# Format frontend code
npm run format

# Lint frontend code
npm run lint

# Build for production
npm run build
```

---

Thank you for contributing to Cyber Container Platform! 🚀

If you have any questions, don't hesitate to reach out through GitHub Discussions or by opening an issue.
