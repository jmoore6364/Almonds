# Enterprise Features Guide

Comprehensive guide to advanced features available in the Almonds platform.

## Table of Contents

- [Audit Logging](#audit-logging)
- [Webhooks](#webhooks)
- [API Keys](#api-keys)
- [Workflows & Automation](#workflows--automation)
- [Infrastructure as Code](#infrastructure-as-code)
- [Monitoring & Alerts](#monitoring--alerts)

## Audit Logging

Enterprise-grade audit trail system for compliance, security, and debugging.

### Overview

The audit logging system automatically tracks all significant actions performed in your organization, providing a complete audit trail for compliance (SOC 2, HIPAA, GDPR) and security investigations.

### Features

- **Automatic Logging**: Use decorators to automatically log actions
- **50+ Action Types**: Comprehensive coverage of all platform actions
- **Query & Filter**: Advanced search and filtering capabilities
- **Statistics**: Visual analytics of audit activity
- **Export**: Export logs for compliance audits
- **Data Retention**: Configurable retention policies
- **PII Sanitization**: Automatic redaction of sensitive data

### Tracked Actions

**Authentication**
- User login/logout
- Password resets
- Email verification
- 2FA enable/disable

**Organization Management**
- Create, update, delete organizations
- Add/remove members
- Change member roles

**Resource Management**
- Create, update, delete resources
- Start, stop, restart resources
- Status changes

**Security Events**
- Access denied attempts
- Policy changes
- Suspicious activity

**Billing**
- Subscription changes
- Payment success/failure

### Quick Start

#### 1. Automatic Logging with Decorator

```typescript
import { AuditLog } from '../audit/decorators/audit-log.decorator';
import { AuditAction } from '../audit/dto/create-audit-log.dto';
import { AuditLogInterceptor } from '../audit/interceptors/audit-log.interceptor';

@Controller('resources')
@UseInterceptors(AuditLogInterceptor)
export class ResourcesController {
  @Post()
  @AuditLog({
    action: AuditAction.RESOURCE_CREATE,
    resource: 'resource',
    includeBody: true,
  })
  async create(@Body() dto: CreateResourceDto) {
    return this.resourcesService.create(dto);
  }

  @Delete(':id')
  @AuditLog({
    action: AuditAction.RESOURCE_DELETE,
    resource: 'resource',
    resourceIdParam: 'id',
  })
  async remove(@Param('id') id: string) {
    return this.resourcesService.remove(id);
  }
}
```

#### 2. Manual Logging

```typescript
import { AuditService } from '../audit/audit.service';

export class MyService {
  constructor(private auditService: AuditService) {}

  async performAction(organizationId: string, userId: string) {
    try {
      // Perform action
      const result = await this.doSomething();

      // Log success
      await this.auditService.logSuccess(
        organizationId,
        userId,
        AuditAction.RESOURCE_CREATE,
        { result: 'success' },
        {
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          resource: 'resource',
          resourceId: result.id,
        },
      );

      return result;
    } catch (error) {
      // Log failure
      await this.auditService.logFailure(
        organizationId,
        userId,
        AuditAction.RESOURCE_CREATE,
        error,
        { ipAddress: req.ip },
      );

      throw error;
    }
  }
}
```

### API Endpoints

#### Get Audit Logs

```bash
GET /api/v1/audit-logs?organizationId=org-123&limit=20&offset=0

# Filter by user
GET /api/v1/audit-logs?organizationId=org-123&userId=user-456

# Filter by action
GET /api/v1/audit-logs?organizationId=org-123&action=resource.create

# Filter by date range
GET /api/v1/audit-logs?organizationId=org-123&startDate=2024-01-01&endDate=2024-01-31

# Filter by status
GET /api/v1/audit-logs?organizationId=org-123&status=failure
```

Response:
```json
{
  "logs": [
    {
      "id": "audit-123",
      "organizationId": "org-123",
      "userId": "user-456",
      "user": {
        "id": "user-456",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "action": "resource.create",
      "resource": "resource",
      "resourceId": "resource-789",
      "details": {
        "name": "my-server",
        "type": "compute"
      },
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "status": "success",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 1234,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

#### Get Audit Log by ID

```bash
GET /api/v1/audit-logs/audit-123?organizationId=org-123
```

#### Get Audit Statistics

```bash
GET /api/v1/audit-logs/statistics/summary?organizationId=org-123&startDate=2024-01-01&endDate=2024-01-31
```

Response:
```json
{
  "total": 1234,
  "byAction": [
    { "action": "user.login", "count": 456 },
    { "action": "resource.create", "count": 123 }
  ],
  "byUser": [
    { "userId": "user-456", "count": 234 },
    { "userId": "user-789", "count": 156 }
  ],
  "byStatus": [
    { "status": "success", "count": 1200 },
    { "status": "failure", "count": 34 }
  ],
  "recentActivity": [
    { "date": "2024-01-15", "count": 156 },
    { "date": "2024-01-14", "count": 142 }
  ]
}
```

#### Export Audit Logs

```bash
GET /api/v1/audit-logs/export/logs?organizationId=org-123&startDate=2024-01-01&endDate=2024-01-31
```

### Data Retention

Configure retention policies to automatically delete old audit logs:

```typescript
// Delete logs older than 90 days
await auditService.deleteOldLogs(organizationId, 90);
```

### Security & Privacy

- **PII Sanitization**: Sensitive fields (passwords, tokens, keys) are automatically redacted
- **Access Control**: Only organization members can view audit logs
- **Admin-Only Features**: Statistics and exports require admin/owner role

---

## Webhooks

Real-time event notifications via HTTP callbacks with intelligent retry logic.

### Overview

Webhooks allow you to receive HTTP callbacks when events occur in your organization. Perfect for integrating with external systems, triggering automation, or keeping systems in sync.

### Features

- **25+ Event Types**: Comprehensive event coverage
- **Intelligent Retry**: Exponential backoff with configurable retries
- **Signature Verification**: HMAC-SHA256 signatures for security
- **Delivery Tracking**: Complete history of all deliveries
- **Health Monitoring**: Automatic detection of failing webhooks
- **Test Functionality**: Test webhooks before going live
- **Custom Headers**: Add custom HTTP headers
- **Secret Rotation**: Regenerate secrets without downtime

### Supported Events

**Resources**
- `resource.created`
- `resource.updated`
- `resource.deleted`
- `resource.status_changed`

**Organization**
- `organization.updated`
- `organization.member_added`
- `organization.member_removed`

**Billing**
- `subscription.created`
- `subscription.updated`
- `subscription.canceled`
- `payment.succeeded`
- `payment.failed`

**Alerts**
- `alert.triggered`
- `alert.resolved`

**Workflows**
- `workflow.started`
- `workflow.completed`
- `workflow.failed`

**IaC**
- `iac.deployment_started`
- `iac.deployment_completed`
- `iac.deployment_failed`

**Health Checks**
- `health_check.failed`
- `health_check.recovered`

### Quick Start

#### 1. Create a Webhook

```bash
POST /api/v1/webhooks?organizationId=org-123
Content-Type: application/json

{
  "name": "Production Alerts",
  "description": "Send alerts to Slack",
  "url": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
  "events": [
    "resource.created",
    "resource.deleted",
    "alert.triggered"
  ],
  "headers": {
    "X-Custom-Header": "value"
  },
  "retryConfig": {
    "maxRetries": 3,
    "retryDelayMs": 1000,
    "backoffMultiplier": 2,
    "timeout": 5000
  }
}
```

Response:
```json
{
  "id": "webhook-123",
  "name": "Production Alerts",
  "url": "https://hooks.slack.com/...",
  "secret": "whsec_abc123...",
  "events": ["resource.created", "resource.deleted", "alert.triggered"],
  "enabled": true,
  "status": "healthy",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**Important**: Save the `secret` - it's only shown on creation!

#### 2. Receive Webhook Events

Your webhook endpoint will receive POST requests with the following headers:

```
Content-Type: application/json
X-Webhook-Event: resource.created
X-Webhook-Signature: abc123...
X-Webhook-Timestamp: 1642248600000
X-Webhook-Delivery-Id: delivery-123
User-Agent: Almonds-Webhooks/1.0
```

Payload example:
```json
{
  "id": "resource-456",
  "organizationId": "org-123",
  "type": "compute",
  "name": "my-server",
  "status": "active",
  "provider": "aws",
  "region": "us-east-1",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

#### 3. Verify Webhook Signature

```javascript
// Node.js example
const crypto = require('crypto');

function verifyWebhook(secret, signature, timestamp, payload) {
  const message = `${timestamp}.${JSON.stringify(payload)}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Express middleware
app.post('/webhooks/almonds', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const timestamp = req.headers['x-webhook-timestamp'];
  const secret = process.env.WEBHOOK_SECRET;

  if (!verifyWebhook(secret, signature, timestamp, req.body)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Process webhook
  console.log('Received event:', req.headers['x-webhook-event']);
  console.log('Payload:', req.body);

  res.status(200).json({ received: true });
});
```

### API Endpoints

#### List Webhooks

```bash
GET /api/v1/webhooks?organizationId=org-123
```

#### Get Webhook

```bash
GET /api/v1/webhooks/webhook-123?organizationId=org-123
```

#### Update Webhook

```bash
PATCH /api/v1/webhooks/webhook-123?organizationId=org-123
Content-Type: application/json

{
  "enabled": false,
  "events": ["resource.created"]
}
```

#### Delete Webhook

```bash
DELETE /api/v1/webhooks/webhook-123?organizationId=org-123
```

#### Test Webhook

```bash
POST /api/v1/webhooks/webhook-123/test?organizationId=org-123
Content-Type: application/json

{
  "event": "resource.created",
  "payload": {
    "id": "test-resource",
    "name": "Test Resource"
  }
}
```

#### Get Delivery History

```bash
GET /api/v1/webhooks/webhook-123/deliveries?organizationId=org-123&limit=50
```

Response:
```json
[
  {
    "id": "delivery-123",
    "webhookId": "webhook-123",
    "event": "resource.created",
    "status": "success",
    "statusCode": 200,
    "responseTimeMs": 142,
    "attempts": 1,
    "createdAt": "2024-01-15T10:30:00Z",
    "deliveredAt": "2024-01-15T10:30:01Z"
  },
  {
    "id": "delivery-124",
    "webhookId": "webhook-123",
    "event": "resource.deleted",
    "status": "failed",
    "statusCode": 500,
    "attempts": 4,
    "errorMessage": "Connection timeout",
    "createdAt": "2024-01-15T10:25:00Z"
  }
]
```

#### Regenerate Secret

```bash
POST /api/v1/webhooks/webhook-123/regenerate-secret?organizationId=org-123
```

### Retry Logic

Webhooks are delivered with intelligent retry logic:

1. **Initial Attempt**: Webhook is sent immediately
2. **Retry 1**: After 1 second (if failed)
3. **Retry 2**: After 2 seconds (exponential backoff)
4. **Retry 3**: After 4 seconds (exponential backoff)
5. **Final Failure**: Marked as failed after all retries exhausted

**Configurable Parameters:**
- `maxRetries`: 0-10 (default: 3)
- `retryDelayMs`: 100-60000ms (default: 1000ms)
- `backoffMultiplier`: 1-10 (default: 2)
- `timeout`: 1000-60000ms (default: 5000ms)

### Health Monitoring

Webhooks are automatically monitored for health:

- **Healthy**: Recent deliveries are successful
- **Failing**: More than 50% of last 10 deliveries failed
- **Disabled**: Webhook manually disabled

### Triggering Webhooks from Code

```typescript
import { WebhooksService } from './webhooks/webhooks.service';
import { WebhookEvent } from './webhooks/dto/create-webhook.dto';

export class ResourcesService {
  constructor(private webhooksService: WebhooksService) {}

  async createResource(organizationId: string, dto: CreateResourceDto) {
    const resource = await this.prisma.resource.create({ data: dto });

    // Trigger webhooks
    await this.webhooksService.triggerEvent(
      organizationId,
      WebhookEvent.RESOURCE_CREATED,
      {
        id: resource.id,
        name: resource.name,
        type: resource.type,
        status: resource.status,
        createdAt: resource.createdAt,
      },
    );

    return resource;
  }
}
```

### Best Practices

1. **Verify Signatures**: Always verify webhook signatures to prevent spoofing
2. **Return Quickly**: Respond with 200 OK immediately, process asynchronously
3. **Handle Duplicates**: Same event may be sent multiple times on retries
4. **Use HTTPS**: Only use HTTPS URLs for security
5. **Monitor Health**: Check webhook delivery success rate regularly
6. **Test First**: Use test functionality before going live
7. **Rotate Secrets**: Regenerate secrets periodically for security

### Example Integrations

**Slack Notification:**
```bash
POST /api/v1/webhooks?organizationId=org-123
{
  "name": "Slack Alerts",
  "url": "https://hooks.slack.com/services/YOUR/WEBHOOK",
  "events": ["alert.triggered", "health_check.failed"]
}
```

**Discord Notification:**
```bash
POST /api/v1/webhooks?organizationId=org-123
{
  "name": "Discord Notifications",
  "url": "https://discord.com/api/webhooks/YOUR_WEBHOOK_URL",
  "events": ["resource.created", "iac.deployment_completed"]
}
```

**Custom Integration:**
```bash
POST /api/v1/webhooks?organizationId=org-123
{
  "name": "Custom System",
  "url": "https://your-system.com/webhooks/almonds",
  "events": ["*"],  // All events
  "headers": {
    "Authorization": "Bearer your-api-key",
    "X-Custom-ID": "your-system-id"
  }
}
```

---

## Summary

The Almonds platform now includes enterprise-grade features for audit logging and webhooks:

### Audit Logging
- ✅ Comprehensive audit trail
- ✅ 50+ tracked actions
- ✅ Query and filter capabilities
- ✅ Statistics and analytics
- ✅ Export for compliance
- ✅ Automatic PII sanitization
- ✅ Role-based access control

### Webhooks
- ✅ 25+ event types
- ✅ Intelligent retry with exponential backoff
- ✅ HMAC-SHA256 signature verification
- ✅ Delivery tracking and history
- ✅ Health monitoring
- ✅ Test functionality
- ✅ Custom headers support
- ✅ Secret rotation

These features provide the foundation for building compliant, secure, and well-integrated SaaS applications.

---

**Last Updated**: 2024-01-15
**Version**: 1.1.0
**Maintained By**: Almonds Engineering Team
