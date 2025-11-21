# Cloud Provider Integrations

Complete guide for integrating and managing cloud resources across AWS and Azure.

## Table of Contents

- [Overview](#overview)
- [AWS Integration](#aws-integration)
- [Azure Integration](#azure-integration)
- [API Reference](#api-reference)
- [Resource Syncing](#resource-syncing)
- [Best Practices](#best-practices)

## Overview

Almonds supports multi-cloud resource management through native SDK integrations with AWS and Azure. The platform automatically discovers and syncs resources from connected providers, enabling centralized management and cost tracking.

### Supported Providers

| Provider | Status | Resources Supported |
|----------|--------|-------------------|
| AWS | ✅ Production | EC2, S3, RDS, Lambda |
| Azure | ✅ Production | VMs, Storage Accounts |
| GCP | 🔜 Coming Soon | - |
| DigitalOcean | 🔜 Coming Soon | - |

### Features

- **Automatic Resource Discovery**: Scan and import all resources from cloud accounts
- **Real-Time Sync**: Keep resource status up-to-date
- **Cost Tracking**: Monitor costs across all providers
- **Resource Management**: Start, stop, and manage resources from one interface
- **Credential Security**: Encrypted storage of cloud credentials

## AWS Integration

### Prerequisites

- AWS Account with programmatic access
- IAM User with appropriate permissions
- Access Key ID and Secret Access Key

### Required IAM Permissions

Create an IAM policy with the following permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeInstances",
        "ec2:DescribeRegions",
        "ec2:StartInstances",
        "ec2:StopInstances",
        "ec2:TerminateInstances",
        "s3:ListAllMyBuckets",
        "s3:GetBucketLocation",
        "s3:GetBucketTagging",
        "rds:DescribeDBInstances",
        "lambda:ListFunctions",
        "lambda:ListTags",
        "ce:GetCostAndUsage"
      ],
      "Resource": "*"
    }
  ]
}
```

### Connect AWS Provider

```bash
POST /api/v1/providers
Authorization: Bearer <token>
Content-Type: application/json

{
  "organizationId": "org-123",
  "name": "Production AWS",
  "provider": "aws",
  "region": "us-east-1",
  "credentials": {
    "accessKeyId": "AKIAIOSFODNN7EXAMPLE",
    "secretAccessKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
  }
}
```

### Test Connection

```bash
POST /api/v1/providers/:id/test
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Connection test successful"
}
```

### Sync AWS Resources

```bash
POST /api/v1/providers/:id/sync
Authorization: Bearer <token>

Response:
{
  "message": "Resource sync completed",
  "providerId": "provider-123",
  "provider": "aws",
  "resourceCount": 47,
  "resources": [...]
}
```

### Supported AWS Resources

#### EC2 Instances

Automatically discovers and tracks:
- Instance ID, name, and type
- Instance state (running, stopped, terminated)
- Launch time and availability zone
- Public and private IP addresses
- VPC and subnet information
- Instance tags

**Actions:**
- Start instance
- Stop instance
- Terminate instance

#### S3 Buckets

Automatically discovers and tracks:
- Bucket name and region
- Creation date
- Bucket tags

#### RDS Instances

Automatically discovers and tracks:
- Database identifier and engine
- Engine version and instance class
- Allocated storage and storage type
- Multi-AZ configuration
- Endpoint and port
- Database status

#### Lambda Functions

Automatically discovers and tracks:
- Function name and ARN
- Runtime and handler
- Code size and timeout
- Memory allocation
- Last modified date
- Function tags

#### Cost Explorer

Retrieves cost data by:
- Service (EC2, S3, RDS, etc.)
- Time period (daily, monthly)
- Usage quantity and cost

## Azure Integration

### Prerequisites

- Azure Account and subscription
- Azure AD Service Principal
- Tenant ID, Client ID, Client Secret, Subscription ID

### Create Service Principal

```bash
# Using Azure CLI
az ad sp create-for-rbac --name "almonds-resource-manager" \
  --role "Reader" \
  --scopes /subscriptions/{subscription-id}
```

This command will output:
- appId (Client ID)
- password (Client Secret)
- tenant (Tenant ID)

### Required Permissions

Assign the following roles to the service principal:
- **Reader**: View all resources
- **Virtual Machine Contributor**: Manage VMs
- **Storage Account Contributor**: Manage storage accounts

### Connect Azure Provider

```bash
POST /api/v1/providers
Authorization: Bearer <token>
Content-Type: application/json

{
  "organizationId": "org-123",
  "name": "Production Azure",
  "provider": "azure",
  "region": "eastus",
  "credentials": {
    "clientId": "12345678-1234-1234-1234-123456789012",
    "clientSecret": "your-client-secret",
    "tenantId": "87654321-4321-4321-4321-210987654321",
    "subscriptionId": "abcdef12-ab12-ab12-ab12-abcdef123456"
  }
}
```

### Supported Azure Resources

#### Virtual Machines

Automatically discovers and tracks:
- VM ID, name, and location
- VM size and OS type
- Power state (running, stopped, deallocated)
- Provisioning state
- Resource tags

**Actions:**
- Start VM
- Stop VM (power off)
- Deallocate VM (stop and release compute)

#### Storage Accounts

Automatically discovers and tracks:
- Storage account name and ID
- Location and SKU
- Account kind and access tier
- Creation time
- Primary location and status
- Resource tags

## API Reference

### Providers Endpoints

#### List Providers

```
GET /api/v1/providers?organizationId=:organizationId
```

Response:
```json
[
  {
    "id": "provider-123",
    "name": "Production AWS",
    "provider": "aws",
    "status": "connected",
    "region": "us-east-1",
    "lastSynced": "2024-01-15T10:30:00Z",
    "resourceCount": 47
  }
]
```

#### Get Provider

```
GET /api/v1/providers/:id
```

#### Create Provider

```
POST /api/v1/providers
```

#### Update Provider

```
PATCH /api/v1/providers/:id
```

#### Delete Provider

```
DELETE /api/v1/providers/:id
```

#### Test Connection

```
POST /api/v1/providers/:id/test
```

#### Sync Resources

```
POST /api/v1/providers/:id/sync
```

### Resource Actions

Resource-specific actions are available through the resources endpoints:

```
POST /api/v1/resources/:id/start    # Start EC2 instance or Azure VM
POST /api/v1/resources/:id/stop     # Stop EC2 instance or Azure VM
POST /api/v1/resources/:id/terminate # Terminate EC2 instance
POST /api/v1/resources/:id/deallocate # Deallocate Azure VM
```

## Resource Syncing

### How It Works

1. **Provider Connection**: User adds cloud provider credentials
2. **Test Connection**: System validates credentials
3. **Resource Discovery**: System scans all supported services
4. **Database Upsert**: Resources are created or updated in database
5. **Status Tracking**: Provider status updated (connected/error)

### Sync Flow

```
┌─────────────────┐
│  User Initiates │
│      Sync       │
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Validate       │
│  Credentials    │
└────────┬────────┘
         │
         v
┌─────────────────┐      ┌─────────────────┐
│  AWS Service    │──────│  List EC2       │
│  Integration    │      │  List S3        │
│                 │      │  List RDS       │
│                 │      │  List Lambda    │
└────────┬────────┘      └─────────────────┘
         │
         v
┌─────────────────┐
│  Transform      │
│  Resources      │
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Upsert to DB   │
│  (by external   │
│   ID)           │
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Update Last    │
│  Synced Time    │
└─────────────────┘
```

### Upsert Logic

Resources are upserted using a composite key: `providerId + externalId`

- **Create**: If resource doesn't exist
- **Update**: If resource exists, update status, tags, metadata

This ensures:
- No duplicate resources
- Status stays current
- Deleted resources can be detected (not returned in sync)

### Sync Frequency

Recommended sync intervals:
- **Manual**: On-demand via API
- **Scheduled**: Every 15-30 minutes (future feature)
- **Webhook**: Real-time when supported by provider (future feature)

## Best Practices

### Security

1. **Use IAM Roles**: Prefer IAM roles over access keys when possible
2. **Least Privilege**: Grant only necessary permissions
3. **Rotate Credentials**: Regularly rotate access keys and secrets
4. **Encrypt Storage**: All credentials are encrypted at rest
5. **Audit Access**: Monitor who connects providers and syncs resources

### Performance

1. **Regional Endpoints**: Use region-specific endpoints when available
2. **Batch Operations**: Sync multiple resource types in parallel
3. **Rate Limiting**: Respect cloud provider API limits
4. **Caching**: Cache resource data between syncs

### Cost Optimization

1. **Monitor API Calls**: Cloud provider APIs may incur costs
2. **Selective Sync**: Only sync resources you need to manage
3. **Cost Alerts**: Set up budget alerts in Cost Explorer
4. **Tag Resources**: Use tags for cost allocation

### Error Handling

1. **Connection Failures**: Provider status set to "error"
2. **Partial Failures**: Continue syncing other resources
3. **Retry Logic**: Automatic retry for transient errors
4. **Logging**: All errors logged for debugging

## Troubleshooting

### Common Issues

#### AWS Connection Failed

**Problem**: `AWS connection failed: Invalid credentials`

**Solutions**:
- Verify Access Key ID and Secret Access Key
- Check IAM user permissions
- Ensure credentials haven't expired
- Verify region is correct

#### Azure Connection Failed

**Problem**: `Azure connection failed: Unauthorized`

**Solutions**:
- Verify Client ID, Client Secret, Tenant ID
- Check service principal permissions
- Ensure subscription ID is correct
- Verify service principal hasn't expired

#### No Resources Found

**Problem**: Sync completes but shows 0 resources

**Solutions**:
- Verify resources exist in the cloud account
- Check region matches where resources are deployed
- Ensure IAM permissions include List/Describe actions
- Try syncing specific resource types individually

#### Sync Takes Too Long

**Problem**: Resource sync times out or takes > 2 minutes

**Solutions**:
- Reduce number of resources (archive old resources)
- Sync specific resource types separately
- Check cloud provider API status
- Increase sync timeout configuration

## Future Enhancements

### Planned Features

- **GCP Integration**: Google Cloud Platform support
- **DigitalOcean**: Droplets and spaces
- **Heroku**: Apps and add-ons
- **Automated Sync**: Scheduled background syncing
- **Resource Templates**: Pre-configured resource setups
- **Cost Forecasting**: Predict future costs based on usage
- **Resource Recommendations**: AI-powered optimization suggestions
- **Terraform Integration**: Import from Terraform state

### Coming Soon

- WebSocket real-time updates
- Bulk resource operations
- Resource grouping and filtering
- Custom resource tags
- Cost allocation by tag
- Multi-region support per provider

## Support

For issues or questions:
- GitHub Issues: [github.com/almonds/almonds/issues](https://github.com/almonds/almonds/issues)
- Documentation: [docs.almonds.io](https://docs.almonds.io)
- Email: support@almonds.io

---

**Last Updated**: 2024-01-15
**Version**: 1.1.0
**Maintained By**: Almonds Engineering Team
