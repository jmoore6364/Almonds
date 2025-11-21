# Contributing to Almonds Resource Manager

Thank you for your interest in contributing to Almonds! This guide will help you get started with contributing to our full-stack SaaS platform.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors.

### Expected Behavior

- Use welcoming and inclusive language
- Respect differing viewpoints and experiences
- Accept constructive criticism gracefully
- Focus on what is best for the community

### Unacceptable Behavior

- Trolling, insulting comments, or personal attacks
- Public or private harassment
- Publishing others' private information without permission

## Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- PostgreSQL 14+
- Redis 6+
- Docker (recommended)
- Git

### Fork and Clone

```bash
# Fork the repository on GitHub
git clone https://github.com/YOUR_USERNAME/almonds.git
cd almonds

# Add upstream remote
git remote add upstream https://github.com/almonds/almonds.git
```

## Development Setup

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env

# Start services
docker-compose up -d

# Run migrations
npx prisma migrate dev

# Start server
npm run start:dev
```

### Frontend Setup

```bash
npm install
npm start
```

## How to Contribute

### Workflow

1. **Create a branch**:
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make changes** following our coding standards

3. **Add tests** for your changes

4. **Run tests**:
   ```bash
   npm test
   cd backend && npm run test:e2e
   ```

5. **Commit** using conventional commits:
   ```bash
   git commit -m "feat: add new feature"
   ```

6. **Push and open PR**:
   ```bash
   git push origin feature/my-feature
   ```

## Coding Standards

### Backend (NestJS)

```typescript
// ✅ Good
@Injectable()
export class MyService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}

// ✅ Use DTOs
export class CreateUserDto {
  @IsEmail()
  email: string;

  @MinLength(6)
  password: string;
}
```

### Frontend (Angular)

```typescript
// ✅ Use reactive programming
export class ResourceListComponent implements OnInit {
  resources$: Observable<Resource[]>;

  constructor(private resourceService: ResourceService) {}

  ngOnInit() {
    this.resources$ = this.resourceService.getResources();
  }
}
```

### Linting

```bash
npm run lint        # Check
npm run lint:fix    # Fix
npm run format      # Format
```

## Testing Guidelines

### Coverage Requirements

- Minimum: 80% coverage
- Critical paths: 100% (auth, billing, permissions)
- New features must include tests

### Test Examples

```typescript
describe('AuthService', () => {
  it('should validate user credentials', async () => {
    // Arrange
    mockUsersService.findByEmail.mockResolvedValue(mockUser);

    // Act
    const result = await service.validateUser('test@example.com', 'password');

    // Assert
    expect(result).toBeDefined();
  });
});
```

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat: add user profile endpoint
fix(auth): resolve token expiration
docs: update API reference
test: add billing service tests
chore: update dependencies
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style
- `refactor`: Refactoring
- `test`: Tests
- `chore`: Maintenance

## Pull Request Process

### Before Submitting

- [ ] Code follows style guidelines
- [ ] All tests pass
- [ ] Documentation updated
- [ ] Commit messages follow convention

### PR Checklist

1. **Title**: Clear and descriptive
2. **Description**: What, why, how to test
3. **Tests**: All passing
4. **Size**: < 500 lines preferred

### After Merge

```bash
git checkout main
git pull upstream main
```

## Issue Guidelines

### Bug Report Template

```markdown
**Describe the bug**
Clear description

**To Reproduce**
1. Step 1
2. Step 2

**Expected behavior**
What should happen

**Environment**
- OS: macOS 13.0
- Browser: Chrome 120
- Version: 1.0.0
```

### Feature Request Template

```markdown
**Problem**
Description of problem

**Solution**
Desired solution

**Alternatives**
Other options considered
```

## Development Tips

### Debugging

```bash
# Backend
npm run start:debug

# Database
npx prisma studio
```

### Common Commands

```bash
npm install              # Install dependencies
npm run start:dev        # Start development
npm test                 # Run tests
npm run lint             # Lint code
npm run format           # Format code
```

## Questions?

- Check [documentation](https://docs.almonds.io)
- Review [API reference](backend/API.md)
- Ask in GitHub Discussions
- Contact: support@almonds.io

---

**Thank you for contributing! 🎉**
