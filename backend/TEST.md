# Testing Guide

Comprehensive guide for running and writing tests for the Almonds backend API.

## Table of Contents

- [Overview](#overview)
- [Running Tests](#running-tests)
- [Test Structure](#test-structure)
- [Writing Tests](#writing-tests)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

The Almonds backend uses **Jest** as the testing framework with comprehensive unit and end-to-end (E2E) test coverage.

### Test Statistics

- **Total Tests**: 350+ test cases
- **Unit Tests**: 200+ tests across 9 service files
- **E2E Tests**: 150+ tests across 5 endpoint suites
- **Coverage Goal**: 80%+ code coverage

### Test Types

1. **Unit Tests** (`*.spec.ts`): Test individual services in isolation
2. **E2E Tests** (`test/*.e2e-spec.ts`): Test complete API endpoints with real database
3. **Integration Tests**: Test multiple components working together

## Running Tests

### Quick Commands

```bash
# Run all unit tests
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:cov

# Run E2E tests
npm run test:e2e

# Run specific test file
npm test -- auth.service.spec.ts

# Run tests matching a pattern
npm test -- --testPathPattern=billing

# Run tests with verbose output
npm test -- --verbose

# Run tests in debug mode
npm run test:debug
```

### Coverage Reports

```bash
# Generate coverage report
npm run test:cov

# View coverage report in browser
open coverage/lcov-report/index.html
```

Coverage reports show:
- **Statements**: Lines of code executed
- **Branches**: Conditional paths taken
- **Functions**: Functions called
- **Lines**: Individual lines executed

### Continuous Integration

Tests run automatically on:
- Every pull request
- Every push to `main` or `develop` branches
- Manual workflow dispatch

See `.github/workflows/ci-cd.yml` for CI configuration.

## Test Structure

### Unit Tests Location

```
backend/src/
├── auth/
│   └── auth.service.spec.ts           # Authentication tests
├── billing/
│   └── billing.service.spec.ts        # Billing & subscription tests
├── organizations/
│   └── organizations.service.spec.ts  # Organization management tests
├── resources/
│   └── resources.service.spec.ts      # Resource management tests
└── providers/
    └── providers.service.spec.ts      # Cloud provider tests
```

### E2E Tests Location

```
backend/test/
├── auth.e2e-spec.ts           # Authentication endpoints
├── organizations.e2e-spec.ts  # Organization CRUD
├── resources.e2e-spec.ts      # Resource management
├── billing.e2e-spec.ts        # Billing & subscriptions
└── health.e2e-spec.ts         # Health check endpoints
```

## Writing Tests

### Unit Test Template

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { YourService } from './your.service';
import { PrismaService } from '../prisma/prisma.service';

describe('YourService', () => {
  let service: YourService;
  let prismaService: PrismaService;

  // Mock dependencies
  const mockPrismaService = {
    yourModel: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        YourService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<YourService>(YourService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Clear mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('methodName', () => {
    it('should handle success case', async () => {
      // Arrange
      mockPrismaService.yourModel.findUnique.mockResolvedValue(mockData);

      // Act
      const result = await service.methodName('test-id');

      // Assert
      expect(result).toEqual(mockData);
      expect(mockPrismaService.yourModel.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-id' },
      });
    });

    it('should throw NotFoundException when not found', async () => {
      // Arrange
      mockPrismaService.yourModel.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.methodName('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
```

### E2E Test Template

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('YourFeature (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Clean up test database
    await prisma.yourModel.deleteMany();
    await prisma.user.deleteMany();

    // Create test user and get auth token
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      })
      .expect(201);

    authToken = response.body.access_token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('GET /api/v1/your-endpoint', () => {
    it('should return data when authenticated', () => {
      return request(app.getHttpServer())
        .get('/api/v1/your-endpoint')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .get('/api/v1/your-endpoint')
        .expect(401);
    });
  });

  describe('POST /api/v1/your-endpoint', () => {
    it('should create resource', () => {
      return request(app.getHttpServer())
        .post('/api/v1/your-endpoint')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Resource',
          // ... other fields
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe('Test Resource');
        });
    });

    it('should validate input', () => {
      return request(app.getHttpServer())
        .post('/api/v1/your-endpoint')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // Missing required fields
        })
        .expect(400);
    });
  });
});
```

## Test Examples

### Testing Authentication

```typescript
describe('AuthService', () => {
  describe('validateUser', () => {
    it('should return user without password when credentials are valid', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result.passwordHash).toBeUndefined();
      expect(result.email).toBe('test@example.com');
    });

    it('should return null when password is invalid', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      const result = await service.validateUser('test@example.com', 'wrong');

      expect(result).toBeNull();
    });
  });

  describe('register', () => {
    it('should create new user and send verification email', async () => {
      mockUsersService.create.mockResolvedValue(mockUser);

      await service.register({
        email: 'new@example.com',
        name: 'New User',
        password: 'password123',
      });

      expect(mockMailService.sendVerificationEmail).toHaveBeenCalled();
    });
  });
});
```

### Testing with Mocked Dependencies

```typescript
describe('BillingService', () => {
  const mockStripeService = {
    createCheckoutSession: jest.fn(),
    createBillingPortalSession: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        { provide: StripeService, useValue: mockStripeService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
  });

  it('should create checkout session for Pro plan', async () => {
    mockStripeService.createCheckoutSession.mockResolvedValue({
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/pay/cs_test_123',
    });

    const result = await service.createCheckoutSession({
      organizationId: 'org-123',
      plan: 'pro',
      successUrl: 'https://app.com/success',
      cancelUrl: 'https://app.com/cancel',
    });

    expect(result.url).toBeDefined();
    expect(mockStripeService.createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'subscription',
      }),
    );
  });
});
```

### Testing Error Handling

```typescript
describe('OrganizationsService', () => {
  describe('findOne', () => {
    it('should throw ForbiddenException if user is not a member', async () => {
      mockPrismaService.organizationMember.findUnique.mockResolvedValue(null);

      await expect(
        service.findOne('org-123', 'user-456'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if organization does not exist', async () => {
      mockPrismaService.organizationMember.findUnique.mockResolvedValue(mockMember);
      mockPrismaService.organization.findUnique.mockResolvedValue(null);

      await expect(
        service.findOne('non-existent', 'user-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
```

### Testing Permissions

```typescript
describe('OrganizationsService', () => {
  describe('update', () => {
    it('should allow admin to update organization', async () => {
      const adminMember = { ...mockMember, role: 'admin' };
      mockPrismaService.organizationMember.findUnique.mockResolvedValue(adminMember);
      mockPrismaService.organization.update.mockResolvedValue(updatedOrg);

      const result = await service.update('org-123', 'user-123', updateDto);

      expect(result).toEqual(updatedOrg);
    });

    it('should throw ForbiddenException if user is regular member', async () => {
      const memberRole = { ...mockMember, role: 'member' };
      mockPrismaService.organizationMember.findUnique.mockResolvedValue(memberRole);

      await expect(
        service.update('org-123', 'user-123', updateDto),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should only allow owner to delete organization', async () => {
      const adminMember = { ...mockMember, role: 'admin' };
      mockPrismaService.organizationMember.findUnique.mockResolvedValue(adminMember);

      await expect(
        service.remove('org-123', 'user-123'),
      ).rejects.toThrow(ForbiddenException);

      expect(mockPrismaService.organization.delete).not.toHaveBeenCalled();
    });
  });
});
```

## Best Practices

### 1. Test Organization

- **One test file per service/controller**: `auth.service.spec.ts` for `auth.service.ts`
- **Group related tests**: Use `describe()` blocks for each method
- **Clear test names**: Use descriptive `it()` statements

```typescript
describe('AuthService', () => {
  describe('login', () => {
    it('should return access token when credentials are valid', () => {});
    it('should throw UnauthorizedException when credentials are invalid', () => {});
    it('should include user data in response', () => {});
  });
});
```

### 2. Test Independence

- **No test dependencies**: Each test should run independently
- **Clean state**: Use `beforeEach` to reset mocks and state
- **Database cleanup**: Clear test data in `beforeAll` and `afterAll`

```typescript
beforeEach(() => {
  jest.clearAllMocks();
});

afterAll(async () => {
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});
```

### 3. AAA Pattern

Follow **Arrange-Act-Assert** pattern:

```typescript
it('should create user', async () => {
  // Arrange: Set up test data and mocks
  const userData = { email: 'test@example.com', name: 'Test' };
  mockPrismaService.user.create.mockResolvedValue(mockUser);

  // Act: Execute the code under test
  const result = await service.create(userData);

  // Assert: Verify expectations
  expect(result).toEqual(mockUser);
  expect(mockPrismaService.user.create).toHaveBeenCalledWith({
    data: expect.objectContaining(userData),
  });
});
```

### 4. Mock External Dependencies

- **Mock all external services**: Stripe, SendGrid, AWS SDK
- **Use jest.fn()** for simple mocks
- **Use jest.spyOn()** for existing methods

```typescript
// Mock module
jest.mock('@sendgrid/mail', () => ({
  setApiKey: jest.fn(),
  send: jest.fn(),
}));

// Mock specific function
jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
```

### 5. Test Edge Cases

- **Null/undefined inputs**
- **Empty arrays/objects**
- **Invalid data types**
- **Boundary conditions**
- **Error scenarios**

```typescript
it('should handle empty array', async () => {
  mockPrismaService.resource.findMany.mockResolvedValue([]);
  const result = await service.findAll('org-123', 'user-123');
  expect(result).toEqual([]);
});

it('should throw error for invalid ID format', async () => {
  await expect(service.findOne('invalid-id', 'user-123')).rejects.toThrow();
});
```

### 6. Coverage Goals

- **Aim for 80%+ coverage**
- **Focus on critical paths**: Authentication, billing, permissions
- **Don't obsess over 100%**: Some code is hard to test meaningfully

```bash
# Check coverage
npm run test:cov

# Coverage thresholds in package.json
"jest": {
  "coverageThreshold": {
    "global": {
      "branches": 80,
      "functions": 80,
      "lines": 80,
      "statements": 80
    }
  }
}
```

## Troubleshooting

### Common Issues

#### 1. Tests Timeout

```bash
# Increase Jest timeout
jest.setTimeout(30000); // 30 seconds

# In specific test
it('should handle long operation', async () => {
  jest.setTimeout(10000);
  // ... test code
}, 10000);
```

#### 2. Database Connection Errors

```bash
# Ensure test database is running
docker-compose up -d postgres

# Use separate test database
DATABASE_URL="postgresql://user:password@localhost:5432/almonds_test"
```

#### 3. Mock Not Working

```typescript
// Clear mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
  jest.resetAllMocks(); // Reset implementation
  jest.restoreAllMocks(); // Restore original implementation
});
```

#### 4. E2E Test Flakiness

```typescript
// Use transactions for database cleanup
beforeEach(async () => {
  await prisma.$transaction([
    prisma.resource.deleteMany(),
    prisma.organization.deleteMany(),
    prisma.user.deleteMany(),
  ]);
});
```

#### 5. Import Errors

```typescript
// Use module path mapping
import { PrismaService } from '@/prisma/prisma.service';

// Or configure tsconfig-paths in jest.config.js
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/src/$1',
},
```

### Debugging Tests

```bash
# Run single test file
npm test -- auth.service.spec.ts

# Run single test case
npm test -- -t "should return user"

# Debug mode (attach debugger)
npm run test:debug

# Verbose output
npm test -- --verbose

# Show console.log in tests
npm test -- --silent=false
```

### Watch Mode Tips

```bash
# Run tests in watch mode
npm run test:watch

# In watch mode:
# Press 'a' to run all tests
# Press 'f' to run only failed tests
# Press 'p' to filter by filename
# Press 't' to filter by test name
# Press 'q' to quit
```

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing NestJS Applications](https://docs.nestjs.com/fundamentals/testing)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://testingjavascript.com/)

## Contributing

When adding new features:

1. **Write tests first** (TDD approach) or alongside implementation
2. **Ensure all tests pass**: `npm test`
3. **Check coverage**: `npm run test:cov`
4. **Add E2E tests** for new endpoints
5. **Update this document** if adding new testing patterns

---

**Happy Testing! 🧪**
