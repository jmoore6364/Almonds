# Database Schema Design

## Multi-Tenant Architecture

All tables include `organization_id` for tenant isolation (except `users` and `organizations`).

---

## Core Tables

### `users`
User accounts with authentication credentials.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  email_verification_token VARCHAR(255),
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMP,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_email_verification_token ON users(email_verification_token);
```

### `organizations`
Multi-tenant organization data.

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  website VARCHAR(255),
  plan VARCHAR(50) DEFAULT 'free', -- free, pro, business, enterprise
  status VARCHAR(50) DEFAULT 'active', -- active, suspended, cancelled
  trial_ends_at TIMESTAMP,
  subscription_id VARCHAR(255), -- Stripe subscription ID
  stripe_customer_id VARCHAR(255),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_stripe_customer_id ON organizations(stripe_customer_id);
```

### `organization_members`
Organization membership and roles.

```sql
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL, -- owner, admin, developer, viewer, billing
  invited_by UUID REFERENCES users(id),
  invited_at TIMESTAMP,
  joined_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_org_members_organization ON organization_members(organization_id);
CREATE INDEX idx_org_members_user ON organization_members(user_id);
```

### `organization_invitations`
Pending organization invitations.

```sql
CREATE TABLE organization_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  invited_by UUID NOT NULL REFERENCES users(id),
  expires_at TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_org_invitations_token ON organization_invitations(token);
CREATE INDEX idx_org_invitations_email ON organization_invitations(email);
```

---

## Resource Management

### `cloud_providers`
Cloud provider connections.

```sql
CREATE TABLE cloud_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- aws, azure, gcp, railway, supabase, etc.
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'active', -- active, inactive, error
  credentials JSONB NOT NULL, -- encrypted credentials
  region VARCHAR(100),
  last_synced TIMESTAMP,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_providers_organization ON cloud_providers(organization_id);
CREATE INDEX idx_providers_provider_type ON cloud_providers(provider);
```

### `resources`
Cloud resources across all providers.

```sql
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES cloud_providers(id) ON DELETE CASCADE,
  external_id VARCHAR(255) NOT NULL, -- Provider's resource ID
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL, -- compute, database, storage, network, etc.
  provider VARCHAR(50) NOT NULL, -- aws, azure, etc.
  status VARCHAR(50), -- active, inactive, error, pending
  region VARCHAR(100),
  tags JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  cost_per_month DECIMAL(10, 2),
  currency VARCHAR(10) DEFAULT 'USD',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(provider_id, external_id)
);

CREATE INDEX idx_resources_organization ON resources(organization_id);
CREATE INDEX idx_resources_provider ON resources(provider_id);
CREATE INDEX idx_resources_type ON resources(type);
CREATE INDEX idx_resources_status ON resources(status);
```

---

## API & Integrations

### `api_keys`
API access keys for programmatic access.

```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  key_hash VARCHAR(255) UNIQUE NOT NULL, -- Hashed API key
  key_prefix VARCHAR(20) NOT NULL, -- For display (e.g., "alm_prod_12345...")
  scopes TEXT[] DEFAULT ARRAY[]::TEXT[],
  status VARCHAR(50) DEFAULT 'active', -- active, revoked, expired, suspended
  rate_limit_per_minute INTEGER DEFAULT 60,
  rate_limit_per_hour INTEGER DEFAULT 3000,
  rate_limit_per_day INTEGER DEFAULT 50000,
  ip_whitelist TEXT[] DEFAULT ARRAY[]::TEXT[],
  last_used TIMESTAMP,
  expires_at TIMESTAMP,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_api_keys_organization ON api_keys(organization_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_status ON api_keys(status);
```

### `api_key_usage`
API key usage tracking.

```sql
CREATE TABLE api_key_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  endpoint VARCHAR(255),
  method VARCHAR(10),
  status_code INTEGER,
  response_time_ms INTEGER,
  ip_address INET,
  user_agent TEXT,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_api_usage_key ON api_key_usage(api_key_id);
CREATE INDEX idx_api_usage_created_at ON api_key_usage(created_at);
```

### `webhooks`
Webhook configurations.

```sql
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  secret VARCHAR(255) NOT NULL,
  events TEXT[] DEFAULT ARRAY[]::TEXT[],
  enabled BOOLEAN DEFAULT TRUE,
  status VARCHAR(50) DEFAULT 'healthy', -- healthy, failing, disabled
  headers JSONB DEFAULT '{}',
  retry_config JSONB DEFAULT '{"maxRetries":3,"retryDelayMs":1000,"backoffMultiplier":2,"timeout":5000}',
  last_triggered TIMESTAMP,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_webhooks_organization ON webhooks(organization_id);
CREATE INDEX idx_webhooks_enabled ON webhooks(enabled);
```

### `webhook_deliveries`
Webhook delivery history.

```sql
CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  event VARCHAR(100) NOT NULL,
  payload JSONB,
  status VARCHAR(50), -- pending, success, failed, retrying
  status_code INTEGER,
  response_time_ms INTEGER,
  attempts INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  delivered_at TIMESTAMP
);

CREATE INDEX idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id);
CREATE INDEX idx_webhook_deliveries_created_at ON webhook_deliveries(created_at);
```

---

## Analytics & Monitoring

### `cost_analytics`
Cost analytics data.

```sql
CREATE TABLE cost_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_cost DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  breakdown_by_provider JSONB DEFAULT '{}',
  breakdown_by_resource_type JSONB DEFAULT '{}',
  breakdown_by_region JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cost_analytics_organization ON cost_analytics(organization_id);
CREATE INDEX idx_cost_analytics_period ON cost_analytics(period_start, period_end);
```

### `alerts`
Alert configurations.

```sql
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL, -- cost, resource_status, performance, security, health
  severity VARCHAR(50) NOT NULL, -- info, warning, critical, emergency
  status VARCHAR(50) DEFAULT 'active', -- active, triggered, resolved, disabled
  condition JSONB NOT NULL,
  actions JSONB DEFAULT '[]',
  enabled BOOLEAN DEFAULT TRUE,
  trigger_count INTEGER DEFAULT 0,
  last_triggered TIMESTAMP,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_alerts_organization ON alerts(organization_id);
CREATE INDEX idx_alerts_enabled ON alerts(enabled);
```

### `alert_history`
Alert trigger history.

```sql
CREATE TABLE alert_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  triggered_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,
  severity VARCHAR(50),
  message TEXT,
  details JSONB,
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_by UUID REFERENCES users(id),
  acknowledged_at TIMESTAMP
);

CREATE INDEX idx_alert_history_alert ON alert_history(alert_id);
CREATE INDEX idx_alert_history_triggered_at ON alert_history(triggered_at);
```

### `health_checks`
Resource health check configurations.

```sql
CREATE TABLE health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- http, https, tcp, ping, dns, database
  endpoint TEXT,
  interval_minutes INTEGER DEFAULT 5,
  timeout_seconds INTEGER DEFAULT 10,
  enabled BOOLEAN DEFAULT TRUE,
  status VARCHAR(50), -- healthy, degraded, unhealthy, unknown
  consecutive_failures INTEGER DEFAULT 0,
  last_check TIMESTAMP,
  next_check TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_health_checks_organization ON health_checks(organization_id);
CREATE INDEX idx_health_checks_resource ON health_checks(resource_id);
```

---

## Automation

### `workflows`
Automation workflows.

```sql
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT TRUE,
  trigger JSONB NOT NULL,
  actions JSONB NOT NULL,
  conditions JSONB DEFAULT '[]',
  execution_count INTEGER DEFAULT 0,
  last_executed TIMESTAMP,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_workflows_organization ON workflows(organization_id);
CREATE INDEX idx_workflows_enabled ON workflows(enabled);
```

### `workflow_executions`
Workflow execution history.

```sql
CREATE TABLE workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  status VARCHAR(50), -- pending, running, completed, failed, cancelled
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  duration_ms INTEGER,
  triggered_by VARCHAR(50),
  results JSONB DEFAULT '[]',
  error TEXT
);

CREATE INDEX idx_workflow_executions_workflow ON workflow_executions(workflow_id);
CREATE INDEX idx_workflow_executions_started_at ON workflow_executions(started_at);
```

### `scheduled_tasks`
Scheduled automation tasks.

```sql
CREATE TABLE scheduled_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT TRUE,
  schedule JSONB NOT NULL, -- cron expression and config
  action JSONB NOT NULL,
  last_run TIMESTAMP,
  next_run TIMESTAMP,
  execution_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_scheduled_tasks_organization ON scheduled_tasks(organization_id);
CREATE INDEX idx_scheduled_tasks_next_run ON scheduled_tasks(next_run);
```

### `auto_scaling_policies`
Auto-scaling policies.

```sql
CREATE TABLE auto_scaling_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT TRUE,
  resource_ids UUID[] DEFAULT ARRAY[]::UUID[],
  scale_up_rules JSONB NOT NULL,
  scale_down_rules JSONB NOT NULL,
  min_instances INTEGER NOT NULL,
  max_instances INTEGER NOT NULL,
  cooldown_minutes INTEGER DEFAULT 5,
  last_scaled TIMESTAMP,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_auto_scaling_organization ON auto_scaling_policies(organization_id);
```

---

## Audit & Compliance

### `audit_logs`
Complete audit trail.

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id UUID,
  resource_name VARCHAR(255),
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  status VARCHAR(50) DEFAULT 'success', -- success, failure
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_organization ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

### `compliance_reports`
Compliance reports.

```sql
CREATE TABLE compliance_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  framework VARCHAR(50) NOT NULL, -- soc2, hipaa, gdpr, iso27001, pci_dss
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status VARCHAR(50), -- compliant, non_compliant, partially_compliant, in_progress
  score INTEGER,
  findings JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '[]',
  summary JSONB DEFAULT '{}',
  generated_by UUID REFERENCES users(id),
  generated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_compliance_reports_organization ON compliance_reports(organization_id);
CREATE INDEX idx_compliance_reports_framework ON compliance_reports(framework);
```

---

## Infrastructure as Code

### `iac_templates`
IaC templates.

```sql
CREATE TABLE iac_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL, -- terraform, cloudformation, pulumi, ansible, custom
  category VARCHAR(100),
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  content TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  outputs JSONB DEFAULT '[]',
  dependencies TEXT[] DEFAULT ARRAY[]::TEXT[],
  version VARCHAR(50),
  status VARCHAR(50) DEFAULT 'draft', -- draft, published, deprecated, archived
  is_public BOOLEAN DEFAULT FALSE,
  deployments INTEGER DEFAULT 0,
  rating DECIMAL(3, 2),
  author UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_iac_templates_organization ON iac_templates(organization_id);
CREATE INDEX idx_iac_templates_type ON iac_templates(type);
CREATE INDEX idx_iac_templates_is_public ON iac_templates(is_public);
```

### `iac_deployments`
IaC deployment tracking.

```sql
CREATE TABLE iac_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES iac_templates(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50), -- pending, validating, deploying, completed, failed, rolling_back
  inputs JSONB DEFAULT '{}',
  outputs JSONB DEFAULT '{}',
  resources JSONB DEFAULT '[]',
  logs TEXT[] DEFAULT ARRAY[]::TEXT[],
  error TEXT,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  duration_ms INTEGER,
  deployed_by UUID REFERENCES users(id)
);

CREATE INDEX idx_iac_deployments_template ON iac_deployments(template_id);
CREATE INDEX idx_iac_deployments_organization ON iac_deployments(organization_id);
CREATE INDEX idx_iac_deployments_status ON iac_deployments(status);
```

---

## Billing

### `subscriptions`
Stripe subscriptions.

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_customer_id VARCHAR(255) NOT NULL,
  plan VARCHAR(50) NOT NULL, -- free, pro, business, enterprise
  status VARCHAR(50) NOT NULL, -- active, past_due, canceled, incomplete
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_organization ON subscriptions(organization_id);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
```

### `usage_tracking`
Usage metrics for billing.

```sql
CREATE TABLE usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  metric VARCHAR(100) NOT NULL, -- api_requests, resources, webhooks, etc.
  value INTEGER NOT NULL,
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_usage_tracking_organization ON usage_tracking(organization_id);
CREATE INDEX idx_usage_tracking_period ON usage_tracking(period_start, period_end);
```

---

## Row-Level Security (RLS)

Enable RLS on all organization-scoped tables to ensure tenant isolation:

```sql
-- Example for resources table
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY organization_isolation ON resources
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id')::uuid);
```

Apply similar policies to all tables with `organization_id`.

---

## Indexes Summary

All critical foreign keys have indexes.
Additional performance indexes on:
- Frequently queried columns (status, created_at, email, etc.)
- Compound indexes for common query patterns
- JSONB indexes where needed using GIN

---

## Data Retention

### Automated Cleanup
- `api_key_usage`: Retain for 90 days
- `webhook_deliveries`: Retain for 90 days
- `audit_logs`: Retain based on organization plan (7 days free, 90 days pro, 1 year business, unlimited enterprise)
- `workflow_executions`: Retain for 30 days

Implement using PostgreSQL partitioning or scheduled cleanup jobs.
