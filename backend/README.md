# Almonds Backend API

NestJS backend API for Almonds Resource Manager - a multi-tenant SaaS platform for managing multi-cloud resources.

## Tech Stack

- **Framework**: NestJS 10.x
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT + Passport
- **Payments**: Stripe
- **Email**: SendGrid
- **Job Queues**: Bull + Redis
- **Cloud SDKs**: AWS SDK, Azure SDK
- **API Docs**: Swagger/OpenAPI

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Redis 6+ (for job queues)

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Copy the example environment file and configure your variables:

```bash
cp .env.example .env
```

Edit `.env` with your actual credentials:

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `STRIPE_SECRET_KEY`: Stripe API key
- `SENDGRID_API_KEY`: SendGrid API key
- AWS/Azure credentials for cloud provider integrations

### 3. Database Setup

Generate Prisma client:

```bash
npm run prisma:generate
```

Run database migrations:

```bash
npm run prisma:migrate
```

(Optional) Seed database with sample data:

```bash
npm run prisma:seed
```

Open Prisma Studio to view/edit data:

```bash
npm run prisma:studio
```

### 4. Run the Application

Development mode with hot reload:

```bash
npm run start:dev
```

Production mode:

```bash
npm run build
npm run start:prod
```

The API will be available at:
- API: `http://localhost:3000`
- Swagger Docs: `http://localhost:3000/api/docs`

## API Endpoints

### Authentication

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login with email/password
- `POST /api/v1/auth/logout` - Logout current user
- `POST /api/v1/auth/refresh` - Refresh access token

### Users

- `GET /api/v1/users/me` - Get current user profile
- `PATCH /api/v1/users/me` - Update current user profile

### Organizations

- `GET /api/v1/organizations` - Get all organizations for current user
- `POST /api/v1/organizations` - Create new organization
- `GET /api/v1/organizations/:id` - Get organization by ID
- `PATCH /api/v1/organizations/:id` - Update organization
- `DELETE /api/v1/organizations/:id` - Delete organization
- `GET /api/v1/organizations/:id/members` - Get organization members

### Cloud Providers

- `GET /api/v1/providers?organizationId=:id` - Get all providers
- `POST /api/v1/providers` - Connect new provider
- `GET /api/v1/providers/:id` - Get provider by ID
- `PATCH /api/v1/providers/:id` - Update provider
- `DELETE /api/v1/providers/:id` - Disconnect provider
- `POST /api/v1/providers/:id/sync` - Sync resources from provider

### Resources

- `GET /api/v1/resources?organizationId=:id` - Get all resources
- `POST /api/v1/resources` - Create new resource
- `GET /api/v1/resources/:id` - Get resource by ID
- `PATCH /api/v1/resources/:id` - Update resource
- `DELETE /api/v1/resources/:id` - Delete resource

## Database Schema

The database uses a multi-tenant architecture with the following key models:

- **User** - User accounts with email/password authentication
- **Organization** - Multi-tenant organizations with subscription plans
- **OrganizationMember** - Many-to-many relationship between users and organizations
- **CloudProvider** - Connected cloud provider accounts (AWS, Azure, GCP, etc.)
- **Resource** - Cloud resources tracked across providers
- **ApiKey** - API keys for programmatic access
- **Webhook** - Webhook configurations for event notifications
- **Workflow** - Automation workflows
- **Alert** - Monitoring alerts
- **AuditLog** - Comprehensive audit logging

See `/prisma/schema.prisma` for the complete schema definition.

## Development

### Running Tests

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Linting and Formatting

```bash
# Lint
npm run lint

# Format code
npm run format
```

### Database Migrations

Create a new migration:

```bash
npm run prisma:migrate -- --name migration_name
```

Reset database (WARNING: deletes all data):

```bash
npx prisma migrate reset
```

## Project Structure

```
backend/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── auth/                  # Authentication module
│   │   ├── dto/
│   │   ├── guards/
│   │   ├── strategies/
│   │   ├── auth.controller.ts
│   │   ├── auth.module.ts
│   │   └── auth.service.ts
│   ├── users/                 # Users module
│   ├── organizations/         # Organizations module
│   ├── resources/             # Resources module
│   ├── providers/             # Cloud providers module
│   ├── prisma/                # Prisma service
│   ├── app.module.ts          # Root module
│   ├── app.controller.ts      # Health check
│   └── main.ts                # Application entry point
├── .env.example               # Environment variables template
├── package.json
├── tsconfig.json
└── README.md
```

## Multi-Tenancy

All organization-scoped resources enforce multi-tenancy through:

1. **Database Level**: `organizationId` foreign key on all relevant tables
2. **Application Level**: Middleware validates user's organization membership
3. **Query Level**: All queries automatically filter by `organizationId`

## Security

- Passwords hashed with bcrypt (salt rounds: 10)
- JWT tokens for stateless authentication
- API key hashing (never store plain text)
- Helmet.js for security headers
- Rate limiting (100 requests/minute)
- Input validation with class-validator
- CORS configured for frontend origin

## Deployment

### Docker (Recommended)

```bash
docker-compose up -d
```

### Manual Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Set production environment variables

3. Run database migrations:
   ```bash
   npx prisma migrate deploy
   ```

4. Start the application:
   ```bash
   npm run start:prod
   ```

## License

MIT
