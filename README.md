# Almonds Resource Manager

A production-ready, full-stack multi-cloud SaaS platform for managing cloud resources across AWS, Azure, and other providers. Built with Ionic/Angular frontend and NestJS backend with complete multi-tenancy, authentication, billing, and automation capabilities.

![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Mobile-blue)
![Frontend](https://img.shields.io/badge/Frontend-Ionic%20%7C%20Angular-purple)
![Backend](https://img.shields.io/badge/Backend-NestJS%20%7C%20PostgreSQL-green)
![License](https://img.shields.io/badge/License-MIT-green)

## 🚀 Overview

Almonds is an enterprise-grade SaaS platform that provides a unified interface for managing cloud resources across multiple providers. With complete multi-tenancy, role-based access control, subscription billing, and comprehensive automation, it's designed for teams managing complex cloud infrastructure.

### Key Highlights

- ✅ **Production-Ready Backend**: NestJS REST API with PostgreSQL + Prisma
- ✅ **Complete Multi-Tenancy**: Organization-scoped data isolation
- ✅ **Advanced Authentication**: JWT, OAuth (Google/GitHub), 2FA, email verification
- ✅ **Subscription Billing**: Stripe integration with usage tracking
- ✅ **350+ Tests**: Comprehensive unit and E2E test coverage
- ✅ **CI/CD Pipeline**: GitHub Actions with automated testing and deployment
- ✅ **Production Deployment**: Docker, Kubernetes, and cloud-ready configurations
- ✅ **API-First Design**: RESTful API with Swagger/OpenAPI documentation

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [Documentation](#-documentation)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [API Reference](#-api-reference)
- [Development](#-development)
- [Security](#-security)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### Core Platform Features

#### Multi-Cloud Resource Management
- **Unified Dashboard**: Single pane of glass for all cloud resources
- **Supported Providers**: AWS, Azure, Railway, Supabase, GCP, Vercel, Netlify
- **Real-Time Monitoring**: Live resource status and health tracking
- **Cost Analytics**: Detailed cost breakdown and optimization recommendations
- **Resource Automation**: Workflows, scheduled tasks, and auto-scaling policies

#### Enterprise Multi-Tenancy
- **Complete Organization Isolation**: Database-level tenant separation
- **Team Collaboration**: Invite members with granular role-based permissions
- **Organization Management**: Multiple organizations per user with seamless switching
- **Flexible Plans**: Free, Pro, Business, and Enterprise tiers
- **Usage Tracking**: Plan limits enforcement with usage analytics

#### Advanced Authentication & Security
- **Multiple Auth Methods**: Email/password, Google OAuth, GitHub OAuth
- **Email Verification**: Secure account activation workflow
- **Two-Factor Authentication (2FA)**: TOTP-based with QR code support
- **Password Reset**: Secure token-based password recovery
- **JWT Sessions**: Stateless authentication with refresh tokens
- **Role-Based Access Control (RBAC)**: Owner, Admin, Developer, Viewer, Billing roles

#### Subscription & Billing (Stripe Integration)
- **Subscription Management**: Automated plan upgrades and downgrades
- **Payment Processing**: Secure Stripe Checkout integration
- **Billing Portal**: Self-service subscription and payment management
- **Usage-Based Billing**: Track API calls, resources, and other metrics
- **Plan Limits**: Automatic enforcement of tier-based limits
- **Webhook Handling**: Real-time subscription status updates

#### Analytics & Monitoring
- **Cost Analytics**: Provider, resource type, and region-based cost breakdown
- **Usage Analytics**: Resource utilization and performance metrics
- **Cost Optimization**: AI-powered recommendations for cost savings
- **Budget Alerts**: Proactive notifications for budget thresholds
- **Audit Logging**: Comprehensive activity tracking and compliance reporting

#### Automation & Workflows
- **Workflow Engine**: Create multi-step automation workflows
- **Scheduled Tasks**: Cron-based recurring operations
- **Auto-Scaling**: Metric-based resource scaling policies
- **Event Triggers**: Webhook, alert, and metric threshold triggers
- **Custom Actions**: Script execution, resource management, notifications

#### Integrations & API
- **REST API**: Complete programmatic access to all features
- **API Keys**: Secure key management with scoped permissions
- **Webhooks**: Real-time event notifications to external services
- **Infrastructure as Code**: Terraform, CloudFormation, Pulumi templates
- **Rate Limiting**: Configurable request limits per API key

### Frontend Features

- **Progressive Web App (PWA)**: Installable, offline-capable web application
- **Native Mobile Apps**: iOS and Android via Capacitor
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Real-Time Updates**: Live resource status and notifications
- **Advanced UI**: Ionic components with Angular framework
- **State Management**: NgRx for predictable state handling

## 🏗 Architecture

### Technology Stack

```
┌─────────────────────────────────────────────────────┐
│                    Frontend Layer                    │
│  ┌─────────────────────────────────────────────┐   │
│  │  Ionic 7.5+ │ Angular 17+ │ TypeScript 5.2+ │   │
│  │  NgRx State │ RxJS │ Capacitor (Mobile)     │   │
│  └─────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────┘
                     │ HTTP/REST + JWT
┌────────────────────▼────────────────────────────────┐
│                   Backend API Layer                  │
│  ┌─────────────────────────────────────────────┐   │
│  │  NestJS 10.x │ TypeScript │ Passport.js     │   │
│  │  JWT Auth │ Swagger/OpenAPI │ Bull Queues   │   │
│  └─────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
┌──────────────────┐    ┌──────────────────────┐
│   Data Layer     │    │  External Services   │
│                  │    │                      │
│ PostgreSQL 15+   │    │ Stripe API (Billing) │
│ Prisma ORM       │    │ SendGrid (Email)     │
│ Redis 6+ (Queue) │    │ AWS SDK              │
│                  │    │ Azure SDK            │
└──────────────────┘    └──────────────────────┘
```

### Backend Architecture

```
backend/
├── src/
│   ├── auth/                    # Authentication module
│   │   ├── strategies/         # Passport strategies (JWT, Google, GitHub)
│   │   ├── guards/             # Auth guards
│   │   └── auth.service.ts     # Auth logic (login, register, 2FA)
│   │
│   ├── users/                   # User management
│   ├── organizations/           # Multi-tenant organizations
│   ├── resources/               # Cloud resource management
│   ├── providers/               # Cloud provider connections
│   ├── billing/                 # Stripe billing & subscriptions
│   │   ├── billing.service.ts  # Plan limits, usage tracking
│   │   └── stripe.service.ts   # Stripe API wrapper
│   │
│   ├── mail/                    # Email service (SendGrid)
│   ├── health/                  # Health check endpoints
│   ├── common/                  # Shared utilities
│   │   ├── filters/            # Exception filters
│   │   ├── interceptors/       # Logging interceptors
│   │   └── decorators/         # Custom decorators
│   │
│   └── prisma/                  # Database service
│
├── prisma/
│   └── schema.prisma           # Database schema (28 models)
│
├── test/                        # E2E tests
│   ├── auth.e2e-spec.ts
│   ├── organizations.e2e-spec.ts
│   ├── resources.e2e-spec.ts
│   ├── billing.e2e-spec.ts
│   └── health.e2e-spec.ts
│
├── k8s/                         # Kubernetes manifests
├── .github/workflows/           # CI/CD pipeline
├── docker-compose.yml           # Local development
├── Dockerfile.production        # Production build
└── DEPLOYMENT.md               # Deployment guide
```

### Database Schema

28 Prisma models including:
- **User**: Authentication and profile
- **Organization**: Multi-tenant organizations
- **OrganizationMember**: Team membership with roles
- **CloudProvider**: Provider connections with encrypted credentials
- **Resource**: Cloud resources across providers
- **Subscription**: Stripe subscription tracking
- **UsageRecord**: Billing and usage metrics
- **ApiKey**: API access management
- **Webhook**: Event notification subscriptions
- **Workflow**: Automation workflows
- **AuditLog**: Activity tracking
- And more...

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm 9+
- **PostgreSQL** 14+
- **Redis** 6+ (for background jobs)
- **Docker** (optional, recommended for local development)

### Option 1: Docker Compose (Recommended)

```bash
# Clone the repository
git clone https://github.com/yourusername/almonds.git
cd almonds

# Start backend services (PostgreSQL + Redis + API)
cd backend
docker-compose up -d

# The backend API will be available at http://localhost:3000
# API docs at http://localhost:3000/api/docs

# In a new terminal, start the frontend
cd ..
npm install
npm start

# Frontend available at http://localhost:8100
```

### Option 2: Manual Setup

#### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# Required: DATABASE_URL, JWT_SECRET, STRIPE_SECRET_KEY

# Start PostgreSQL and Redis (if not using Docker)
# PostgreSQL: postgresql://user:password@localhost:5432/almonds
# Redis: redis://localhost:6379

# Run database migrations
npx prisma migrate deploy

# (Optional) Seed demo data
npm run prisma:seed

# Start development server
npm run start:dev

# API runs at http://localhost:3000
# Swagger docs at http://localhost:3000/api/docs
```

#### Frontend Setup

```bash
# From root directory
npm install

# Start development server
npm start

# Or use Ionic CLI
ionic serve

# App runs at http://localhost:8100
```

### First-Time Configuration

1. **Create Admin User**: Register via API or frontend
2. **Create Organization**: Set up your first organization
3. **Connect Cloud Provider**: Add AWS/Azure credentials
4. **Sync Resources**: Import existing cloud resources
5. **Configure Billing** (optional): Add Stripe credentials for subscription management

## 📚 Documentation

### Essential Guides

- **[DEPLOYMENT.md](backend/DEPLOYMENT.md)**: Complete deployment guide (Docker, Kubernetes, PaaS, VPS)
- **[ROADMAP.md](ROADMAP.md)**: Product roadmap and development phases
- **[DATABASE_SCHEMA.md](backend/DATABASE_SCHEMA.md)**: Database schema documentation
- **[API Documentation](http://localhost:3000/api/docs)**: Interactive Swagger/OpenAPI docs

### Environment Variables

#### Backend (.env)

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/almonds"
REDIS_URL="redis://localhost:6379"

# JWT Authentication
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_EXPIRES_IN="30d"

# OAuth (Optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:3000/api/v1/auth/google/callback"

GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
GITHUB_CALLBACK_URL="http://localhost:3000/api/v1/auth/github/callback"

# Email (SendGrid)
SENDGRID_API_KEY="your-sendgrid-api-key"
FROM_EMAIL="noreply@almonds.io"
FRONTEND_URL="http://localhost:8100"

# Billing (Stripe)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Pricing (Stripe Price IDs)
STRIPE_PRICE_PRO="price_pro_monthly"
STRIPE_PRICE_BUSINESS="price_business_monthly"
STRIPE_PRICE_ENTERPRISE="price_enterprise_monthly"

# Application
NODE_ENV="development"
PORT=3000
```

#### Frontend (environment.ts)

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api/v1',
  stripePublishableKey: 'pk_test_...',
};
```

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run tests with coverage
npm run test:cov

# Run E2E tests
npm run test:e2e

# Run specific test file
npm test -- auth.service.spec.ts

# Watch mode
npm run test:watch
```

### Test Coverage

- **Unit Tests**: 200+ test cases
  - AuthService (registration, login, 2FA, OAuth)
  - BillingService (subscriptions, usage, limits)
  - OrganizationsService (CRUD, permissions)
  - ResourcesService (management, filtering)
  - ProvidersService (connections, sync)

- **E2E Tests**: 150+ test cases
  - Authentication flows
  - Organization management
  - Resource operations
  - Billing and subscriptions
  - Health checks

### Frontend Tests

```bash
# Unit tests
npm test

# E2E tests
npm run e2e

# Coverage report
npm run test:coverage
```

## 🚢 Deployment

### Quick Deploy Options

#### 1. Docker (Recommended for Development)

```bash
cd backend

# Build production image
docker build -f Dockerfile.production -t almonds-backend .

# Run with docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

#### 2. Kubernetes (Recommended for Production)

```bash
cd backend/k8s

# Apply configurations
kubectl apply -f deployment.yaml

# Auto-scaling included (3-10 replicas based on CPU)
# Health checks configured for liveness and readiness
```

#### 3. Platform as a Service (Heroku, Railway, Render)

```bash
# Set environment variables in platform dashboard
# Deploy from Git repository
# Platform will use Dockerfile.production automatically
```

#### 4. Traditional VPS (Ubuntu 20.04+)

See [DEPLOYMENT.md](backend/DEPLOYMENT.md) for complete instructions including:
- Nginx configuration
- PM2 process management
- SSL/TLS setup with Let's Encrypt
- Database backup strategies
- Monitoring and logging

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong `JWT_SECRET` (32+ characters)
- [ ] Configure production database (managed PostgreSQL recommended)
- [ ] Set up Redis for job queues
- [ ] Configure SendGrid for emails
- [ ] Add Stripe production keys
- [ ] Enable HTTPS/SSL
- [ ] Set up monitoring (Datadog, New Relic, etc.)
- [ ] Configure backup strategy
- [ ] Review security headers
- [ ] Set up error tracking (Sentry)

## 📖 API Reference

### API Base URL

```
Development: http://localhost:3000/api/v1
Production:  https://api.almonds.io/api/v1
```

### Interactive Documentation

Access Swagger UI at: `http://localhost:3000/api/docs`

### Authentication

```bash
# Register
POST /auth/register
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "securePassword123"
}

# Login
POST /auth/login
{
  "email": "user@example.com",
  "password": "securePassword123"
}

# Response
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "...",
  "user": { "id": "...", "email": "...", "name": "..." }
}

# Use token in subsequent requests
Authorization: Bearer <access_token>
```

### Key Endpoints

#### Organizations
- `GET /organizations` - List user's organizations
- `POST /organizations` - Create organization
- `GET /organizations/:id` - Get organization details
- `PATCH /organizations/:id` - Update organization
- `DELETE /organizations/:id` - Delete organization
- `GET /organizations/:id/members` - List members

#### Resources
- `GET /organizations/:id/resources` - List organization resources
- `POST /resources` - Create resource
- `GET /resources/:id` - Get resource details
- `PATCH /resources/:id` - Update resource
- `DELETE /resources/:id` - Delete resource

#### Billing
- `POST /billing/checkout-session` - Create Stripe checkout
- `POST /billing/portal-session` - Create billing portal session
- `GET /billing/subscription/:organizationId` - Get subscription
- `GET /billing/usage/:organizationId` - Get usage statistics
- `GET /billing/check-limit/:organizationId` - Check plan limits

#### Health
- `GET /health` - Overall health status
- `GET /health/live` - Liveness probe
- `GET /health/ready` - Readiness probe

## 💻 Development

### Project Structure

```
almonds/
├── src/                        # Frontend (Ionic/Angular)
│   ├── app/
│   │   ├── core/              # Core services and models
│   │   ├── features/          # Feature modules
│   │   ├── shared/            # Shared components
│   │   └── app.module.ts
│   ├── theme/
│   └── assets/
│
├── backend/                    # Backend (NestJS)
│   ├── src/                   # Source code
│   ├── test/                  # E2E tests
│   ├── prisma/                # Database schema
│   └── k8s/                   # Kubernetes configs
│
├── .github/workflows/          # CI/CD
└── docs/                       # Documentation
```

### Development Workflow

```bash
# Frontend development
npm start                    # Start dev server
npm run lint                 # Lint code
npm run format               # Format code
npm test                     # Run tests

# Backend development
cd backend
npm run start:dev            # Start with hot-reload
npm run lint                 # Lint code
npm run format               # Format code
npm test                     # Run unit tests
npm run test:e2e             # Run E2E tests

# Database
npx prisma studio            # Visual database editor
npx prisma migrate dev       # Create migration
npx prisma generate          # Update Prisma client
```

### Code Style

- **TypeScript**: Strict mode enabled
- **Linting**: ESLint with Angular/NestJS presets
- **Formatting**: Prettier with 2-space indentation
- **Commits**: Conventional Commits specification

### Adding Features

1. **Backend**: Create module with NestJS CLI
```bash
cd backend
nest g module feature-name
nest g service feature-name
nest g controller feature-name
```

2. **Frontend**: Create feature module
```bash
ionic g module features/feature-name
ionic g component features/feature-name
ionic g service core/services/feature-name
```

3. **Database**: Update Prisma schema
```bash
# Edit prisma/schema.prisma
npx prisma migrate dev --name add-feature-name
npx prisma generate
```

## 🔒 Security

### Security Features

- **Password Hashing**: bcrypt with 10 salt rounds
- **JWT Tokens**: Signed with HS256 algorithm
- **API Rate Limiting**: Configurable per endpoint
- **CORS**: Configured for frontend domain
- **Helmet**: Security headers middleware
- **Input Validation**: class-validator for all DTOs
- **SQL Injection**: Protected via Prisma ORM
- **XSS Protection**: Sanitized outputs
- **CSRF Protection**: Token-based for state-changing operations

### Best Practices

- Never commit `.env` files
- Rotate JWT secrets regularly
- Use strong database passwords
- Enable 2FA for admin accounts
- Review API key permissions
- Monitor audit logs regularly
- Keep dependencies updated
- Use HTTPS in production

### Reporting Vulnerabilities

Email security issues to: security@almonds.io

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes with tests
4. Commit using conventional commits: `git commit -m 'feat: add amazing feature'`
5. Push to your fork: `git push origin feature/amazing-feature`
6. Open a Pull Request

### Development Setup

```bash
# Clone your fork
git clone https://github.com/yourusername/almonds.git
cd almonds

# Add upstream remote
git remote add upstream https://github.com/original/almonds.git

# Create feature branch
git checkout -b feature/my-feature

# Make changes and test
npm test
cd backend && npm test

# Commit and push
git commit -m 'feat: description'
git push origin feature/my-feature
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [NestJS](https://nestjs.com/) - Backend framework
- [Ionic](https://ionicframework.com/) - Mobile framework
- [Angular](https://angular.io/) - Frontend framework
- [Prisma](https://www.prisma.io/) - Database ORM
- [Stripe](https://stripe.com/) - Payment processing
- [PostgreSQL](https://www.postgresql.org/) - Database

## 📞 Support

- **Documentation**: [https://docs.almonds.io](https://docs.almonds.io)
- **API Docs**: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- **Issues**: [GitHub Issues](https://github.com/yourusername/almonds/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/almonds/discussions)
- **Email**: support@almonds.io

## 📊 Project Stats

- **Lines of Code**: 11,000+
- **Test Coverage**: 350+ tests
- **Database Models**: 28 tables
- **API Endpoints**: 50+ endpoints
- **Features**: 100+ implemented features
- **Deployment Options**: 4 (Docker, K8s, PaaS, VPS)

---

**Built with ❤️ for the cloud management community**

*Almonds - Simplifying multi-cloud resource management*
