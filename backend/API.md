# API Reference Guide

Complete API reference for the Almonds Resource Manager backend.

## Base URL

```
Development: http://localhost:3000/api/v1
Production:  https://api.almonds.app/api/v1
```

## Interactive Documentation

Access the interactive Swagger UI documentation at:
- Development: `http://localhost:3000/api/docs`
- Production: `https://api.almonds.app/api/docs`

## Authentication

Most endpoints require authentication using JWT Bearer tokens.

### Getting a Token

```bash
# Register a new user
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "John Doe",
    "password": "securePassword123"
  }'

# Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "emailVerified": false
  }
}
```

### Using the Token

Include the access token in the `Authorization` header:

```bash
curl -X GET http://localhost:3000/api/v1/organizations \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Rate Limiting

API requests are rate-limited to prevent abuse:

- **Default**: 100 requests per minute per IP
- **Authenticated**: 1000 requests per minute per user
- **API Keys**: Configurable per key

When rate limit is exceeded, you'll receive a `429 Too Many Requests` response.

## Error Handling

All errors follow a consistent format:

```json
{
  "statusCode": 400,
  "timestamp": "2025-01-20T10:30:00.000Z",
  "path": "/api/v1/organizations",
  "method": "POST",
  "message": "Validation failed",
  "errors": [
    {
      "field": "name",
      "message": "name should not be empty"
    }
  ]
}
```

### Common Error Codes

- `200 OK`: Request succeeded
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required or invalid
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., duplicate email)
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

## API Endpoints

### Health & Status

#### GET /health

Check overall application health.

**Response:**
```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "memory_heap": { "status": "up" },
    "disk": { "status": "up" }
  }
}
```

#### GET /health/live

Kubernetes liveness probe.

**Response:** `200 OK` if application is running

#### GET /health/ready

Kubernetes readiness probe.

**Response:** `200 OK` if application is ready to serve requests

---

### Authentication

#### POST /auth/register

Register a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "securePassword123"
}
```

**Response:** `201 Created`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

#### POST /auth/login

Authenticate and get access token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:** `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

#### GET /auth/profile

Get current user profile.

**Auth Required:** Yes

**Response:** `200 OK`
```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "emailVerified": true,
  "twoFactorEnabled": false,
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

#### POST /auth/verify-email

Verify email address with token.

**Request:**
```json
{
  "token": "verification-token-from-email"
}
```

**Response:** `200 OK`

#### POST /auth/forgot-password

Request password reset email.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:** `200 OK`

#### POST /auth/reset-password

Reset password with token.

**Request:**
```json
{
  "token": "reset-token-from-email",
  "password": "newPassword123"
}
```

**Response:** `200 OK`

#### POST /auth/2fa/generate

Generate 2FA secret and QR code.

**Auth Required:** Yes

**Response:** `200 OK`
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCode": "data:image/png;base64,iVBORw0KG..."
}
```

#### POST /auth/2fa/enable

Enable 2FA after verifying code.

**Auth Required:** Yes

**Request:**
```json
{
  "code": "123456"
}
```

**Response:** `200 OK`

#### POST /auth/2fa/disable

Disable 2FA.

**Auth Required:** Yes

**Request:**
```json
{
  "code": "123456"
}
```

**Response:** `200 OK`

#### GET /auth/google

Initiate Google OAuth login (redirects to Google).

#### GET /auth/google/callback

Google OAuth callback (handles redirect from Google).

#### GET /auth/github

Initiate GitHub OAuth login (redirects to GitHub).

#### GET /auth/github/callback

GitHub OAuth callback (handles redirect from GitHub).

---

### Organizations

#### GET /organizations

List all organizations for the authenticated user.

**Auth Required:** Yes

**Response:** `200 OK`
```json
[
  {
    "id": "org-uuid",
    "name": "My Organization",
    "slug": "my-organization",
    "plan": "pro",
    "role": "owner",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
]
```

#### POST /organizations

Create a new organization.

**Auth Required:** Yes

**Request:**
```json
{
  "name": "My New Organization",
  "description": "Optional description"
}
```

**Response:** `201 Created`
```json
{
  "id": "org-uuid",
  "name": "My New Organization",
  "slug": "my-new-organization",
  "description": "Optional description",
  "plan": "free",
  "members": [
    {
      "id": "member-uuid",
      "userId": "user-uuid",
      "role": "owner",
      "user": {
        "id": "user-uuid",
        "email": "user@example.com",
        "name": "John Doe"
      }
    }
  ]
}
```

#### GET /organizations/:id

Get organization details.

**Auth Required:** Yes

**Permissions:** Must be a member

**Response:** `200 OK`
```json
{
  "id": "org-uuid",
  "name": "My Organization",
  "slug": "my-organization",
  "description": "Organization description",
  "plan": "pro",
  "members": [...],
  "_count": {
    "resources": 42,
    "apiKeys": 3,
    "webhooks": 2
  }
}
```

#### PATCH /organizations/:id

Update organization.

**Auth Required:** Yes

**Permissions:** Admin or Owner

**Request:**
```json
{
  "name": "Updated Name",
  "description": "Updated description"
}
```

**Response:** `200 OK`

#### DELETE /organizations/:id

Delete organization.

**Auth Required:** Yes

**Permissions:** Owner only

**Response:** `200 OK`

#### GET /organizations/:id/members

List organization members.

**Auth Required:** Yes

**Permissions:** Must be a member

**Response:** `200 OK`
```json
[
  {
    "id": "member-uuid",
    "userId": "user-uuid",
    "role": "owner",
    "joinedAt": "2025-01-01T00:00:00.000Z",
    "user": {
      "id": "user-uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "avatarUrl": null
    }
  }
]
```

---

### Resources

#### GET /organizations/:organizationId/resources

List all resources for an organization.

**Auth Required:** Yes

**Query Parameters:**
- `type` (optional): Filter by resource type (compute, database, storage, etc.)
- `provider` (optional): Filter by provider (aws, azure, gcp, etc.)

**Response:** `200 OK`
```json
[
  {
    "id": "resource-uuid",
    "name": "Production Web Server",
    "type": "compute",
    "provider": "aws",
    "resourceId": "i-1234567890abcdef0",
    "region": "us-east-1",
    "status": "running",
    "metadata": {
      "instanceType": "t3.micro",
      "platform": "linux"
    },
    "cost": 0.0104,
    "cloudProvider": {
      "id": "provider-uuid",
      "name": "AWS Production",
      "provider": "aws",
      "status": "connected"
    },
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
]
```

#### POST /resources

Create a new resource.

**Auth Required:** Yes

**Request:**
```json
{
  "organizationId": "org-uuid",
  "cloudProviderId": "provider-uuid",
  "name": "New EC2 Instance",
  "type": "compute",
  "provider": "aws",
  "resourceId": "i-1234567890abcdef0",
  "region": "us-east-1",
  "status": "running",
  "metadata": {
    "instanceType": "t3.micro"
  },
  "cost": 0.0104
}
```

**Response:** `201 Created`

#### GET /resources/:id

Get resource details.

**Auth Required:** Yes

**Response:** `200 OK`

#### PATCH /resources/:id

Update resource.

**Auth Required:** Yes

**Request:**
```json
{
  "name": "Updated Name",
  "status": "stopped",
  "cost": 0.0
}
```

**Response:** `200 OK`

#### DELETE /resources/:id

Delete resource.

**Auth Required:** Yes

**Response:** `200 OK`

---

### Cloud Providers

#### GET /organizations/:organizationId/providers

List cloud providers for organization.

**Auth Required:** Yes

**Response:** `200 OK`
```json
[
  {
    "id": "provider-uuid",
    "name": "AWS Production",
    "provider": "aws",
    "region": "us-east-1",
    "status": "connected",
    "lastSynced": "2025-01-20T10:00:00.000Z",
    "_count": {
      "resources": 42
    }
  }
]
```

#### POST /providers

Connect a new cloud provider.

**Auth Required:** Yes

**Request:**
```json
{
  "organizationId": "org-uuid",
  "name": "AWS Production",
  "provider": "aws",
  "region": "us-east-1",
  "credentials": {
    "accessKeyId": "AKIA...",
    "secretAccessKey": "secret..."
  },
  "status": "pending"
}
```

**Response:** `201 Created`

**Note:** Credentials are encrypted before storage and never returned in responses.

#### GET /providers/:id

Get provider details.

**Auth Required:** Yes

**Response:** `200 OK` (credentials excluded)

#### PATCH /providers/:id

Update provider.

**Auth Required:** Yes

**Request:**
```json
{
  "name": "AWS Production Updated",
  "status": "connected"
}
```

**Response:** `200 OK`

#### DELETE /providers/:id

Delete provider.

**Auth Required:** Yes

**Response:** `200 OK`

#### POST /providers/:id/sync

Sync resources from cloud provider.

**Auth Required:** Yes

**Response:** `200 OK`
```json
{
  "message": "Resource sync initiated",
  "providerId": "provider-uuid",
  "provider": "aws"
}
```

---

### Billing & Subscriptions

#### POST /billing/checkout-session

Create Stripe checkout session for subscription.

**Auth Required:** Yes

**Request:**
```json
{
  "organizationId": "org-uuid",
  "plan": "pro",
  "successUrl": "https://app.almonds.io/success",
  "cancelUrl": "https://app.almonds.io/cancel"
}
```

**Response:** `201 Created`
```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/pay/cs_test_..."
}
```

#### POST /billing/portal-session

Create Stripe billing portal session.

**Auth Required:** Yes

**Request:**
```json
{
  "organizationId": "org-uuid",
  "returnUrl": "https://app.almonds.io/settings"
}
```

**Response:** `201 Created`
```json
{
  "url": "https://billing.stripe.com/session/..."
}
```

#### GET /billing/subscription/:organizationId

Get subscription details.

**Auth Required:** Yes

**Response:** `200 OK`
```json
{
  "id": "sub-uuid",
  "organizationId": "org-uuid",
  "plan": "pro",
  "status": "active",
  "currentPeriodEnd": "2025-02-01T00:00:00.000Z"
}
```

#### GET /billing/usage/:organizationId

Get usage statistics.

**Auth Required:** Yes

**Query Parameters:**
- `startDate` (optional): Start date for usage period
- `endDate` (optional): End date for usage period

**Response:** `200 OK`
```json
{
  "organizationId": "org-uuid",
  "currentPlan": "pro",
  "usage": {
    "api_requests": 1523,
    "resources": 42,
    "members": 5
  },
  "limits": {
    "api_requests": 10000,
    "resources": 200,
    "members": 50
  }
}
```

#### GET /billing/check-limit/:organizationId

Check if organization is within plan limits.

**Auth Required:** Yes

**Query Parameters:**
- `limitType`: Type of limit to check (apiRequestsPerDay, resources, organizations, members, providers)

**Response:** `200 OK`
```json
{
  "allowed": true,
  "limit": 200,
  "current": 42
}
```

#### POST /billing/track-usage

Track usage metrics.

**Auth Required:** Yes

**Request:**
```json
{
  "organizationId": "org-uuid",
  "metricType": "api_requests",
  "value": 1
}
```

**Response:** `201 Created`

#### POST /billing/webhook

Stripe webhook endpoint for subscription events.

**Auth Required:** No (verified via Stripe signature)

**Headers:**
- `stripe-signature`: Stripe webhook signature

**Note:** This endpoint is called by Stripe, not your application.

---

## Pagination

Endpoints that return lists support pagination:

```bash
GET /organizations/:id/resources?page=2&limit=50
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `sortBy`: Field to sort by
- `sortOrder`: `asc` or `desc`

**Response:**
```json
{
  "data": [...],
  "meta": {
    "total": 150,
    "page": 2,
    "limit": 50,
    "totalPages": 3
  }
}
```

## Filtering & Searching

Many list endpoints support filtering:

```bash
# Filter resources by type
GET /organizations/:id/resources?type=compute

# Filter by multiple criteria
GET /organizations/:id/resources?type=compute&provider=aws&region=us-east-1

# Search by name
GET /organizations/:id/resources?search=production
```

## Webhooks

Configure webhooks to receive real-time notifications about events:

1. Create webhook subscription
2. Receive POST requests to your webhook URL
3. Verify webhook signature
4. Process event payload

**Webhook Payload:**
```json
{
  "id": "event-uuid",
  "type": "resource.created",
  "timestamp": "2025-01-20T10:30:00.000Z",
  "data": {
    "resource": {...}
  }
}
```

**Event Types:**
- `resource.created`
- `resource.updated`
- `resource.deleted`
- `alert.triggered`
- `workflow.completed`
- `subscription.updated`

## API Keys

Generate API keys for programmatic access:

1. Create API key via dashboard or API
2. Configure scopes and rate limits
3. Include in requests: `X-API-Key: alm_prod_...`

**Scopes:**
- `read:resources`
- `write:resources`
- `read:organizations`
- `write:organizations`
- `billing:read`
- `billing:write`

## Best Practices

1. **Always use HTTPS** in production
2. **Handle rate limits** gracefully with exponential backoff
3. **Validate webhook signatures** to prevent forgery
4. **Store tokens securely** (never in client-side code)
5. **Rotate API keys** regularly
6. **Use specific scopes** (principle of least privilege)
7. **Monitor API usage** to stay within limits
8. **Implement proper error handling** for all status codes
9. **Cache responses** when appropriate
10. **Use pagination** for large result sets

## SDK & Client Libraries

Official SDKs coming soon:
- JavaScript/TypeScript
- Python
- Go
- Ruby

## Support

- **Documentation**: https://docs.almonds.io
- **API Status**: https://status.almonds.io
- **Support**: support@almonds.io
- **GitHub Issues**: https://github.com/almonds/almonds/issues

---

*Last updated: 2025-01-20*
