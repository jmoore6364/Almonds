export interface ApiKey {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  key: string;
  prefix: string; // First 8 characters for display (e.g., "alm_12345...")
  scopes: ApiScope[];
  status: ApiKeyStatus;
  rateLimit: RateLimit;
  usage: ApiKeyUsage;
  createdAt: Date;
  createdBy: string;
  lastUsed?: Date;
  expiresAt?: Date;
  ipWhitelist?: string[];
}

export enum ApiKeyStatus {
  ACTIVE = 'active',
  REVOKED = 'revoked',
  EXPIRED = 'expired',
  SUSPENDED = 'suspended'
}

export enum ApiScope {
  READ_RESOURCES = 'read:resources',
  WRITE_RESOURCES = 'write:resources',
  READ_ANALYTICS = 'read:analytics',
  READ_ALERTS = 'read:alerts',
  WRITE_ALERTS = 'write:alerts',
  READ_WORKFLOWS = 'read:workflows',
  WRITE_WORKFLOWS = 'write:workflows',
  EXECUTE_WORKFLOWS = 'execute:workflows',
  READ_AUDIT = 'read:audit',
  READ_ORGANIZATION = 'read:organization',
  WRITE_ORGANIZATION = 'write:organization',
  ALL = '*'
}

export interface RateLimit {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  burstLimit?: number;
}

export interface ApiKeyUsage {
  totalRequests: number;
  requestsToday: number;
  requestsThisMonth: number;
  lastRequest?: Date;
  bandwidthUsed: number; // in bytes
  errorRate: number; // percentage
}

export interface CreateApiKeyDto {
  name: string;
  description?: string;
  scopes: ApiScope[];
  expiresAt?: Date;
  rateLimit?: Partial<RateLimit>;
  ipWhitelist?: string[];
}

export interface Webhook {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  url: string;
  secret: string;
  events: WebhookEvent[];
  enabled: boolean;
  status: WebhookStatus;
  headers?: Record<string, string>;
  retryConfig: RetryConfig;
  stats: WebhookStats;
  createdAt: Date;
  createdBy: string;
  lastTriggered?: Date;
}

export enum WebhookEvent {
  RESOURCE_CREATED = 'resource.created',
  RESOURCE_UPDATED = 'resource.updated',
  RESOURCE_DELETED = 'resource.deleted',
  ALERT_TRIGGERED = 'alert.triggered',
  WORKFLOW_STARTED = 'workflow.started',
  WORKFLOW_COMPLETED = 'workflow.completed',
  WORKFLOW_FAILED = 'workflow.failed',
  HEALTH_CHECK_FAILED = 'health_check.failed',
  SCALING_EVENT = 'scaling.event',
  COMPLIANCE_REPORT_GENERATED = 'compliance.report_generated',
  BUDGET_THRESHOLD_EXCEEDED = 'budget.threshold_exceeded',
  ALL = '*'
}

export enum WebhookStatus {
  HEALTHY = 'healthy',
  FAILING = 'failing',
  DISABLED = 'disabled'
}

export interface RetryConfig {
  maxRetries: number;
  retryDelayMs: number;
  backoffMultiplier: number;
  timeout: number;
}

export interface WebhookStats {
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  averageResponseTime: number;
  lastSuccess?: Date;
  lastFailure?: Date;
  consecutiveFailures: number;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: WebhookEvent;
  payload: any;
  status: 'pending' | 'success' | 'failed' | 'retrying';
  statusCode?: number;
  responseTime?: number;
  attempts: number;
  error?: string;
  createdAt: Date;
  deliveredAt?: Date;
}

export interface CreateWebhookDto {
  name: string;
  description?: string;
  url: string;
  events: WebhookEvent[];
  headers?: Record<string, string>;
  enabled?: boolean;
}

export interface IacTemplate {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  type: IacTemplateType;
  category: string;
  tags: string[];
  content: string;
  variables: IacVariable[];
  outputs: IacOutput[];
  dependencies?: string[];
  version: string;
  status: TemplateStatus;
  isPublic: boolean;
  deployments: number;
  rating?: number;
  author: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum IacTemplateType {
  TERRAFORM = 'terraform',
  CLOUDFORMATION = 'cloudformation',
  PULUMI = 'pulumi',
  ANSIBLE = 'ansible',
  CUSTOM = 'custom'
}

export enum TemplateStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  DEPRECATED = 'deprecated',
  ARCHIVED = 'archived'
}

export interface IacVariable {
  name: string;
  type: string;
  description: string;
  required: boolean;
  default?: any;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    allowedValues?: any[];
  };
}

export interface IacOutput {
  name: string;
  description: string;
  sensitive: boolean;
}

export interface IacDeployment {
  id: string;
  templateId: string;
  organizationId: string;
  name: string;
  status: DeploymentStatus;
  inputs: Record<string, any>;
  outputs?: Record<string, any>;
  resources: DeployedResource[];
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  deployedBy: string;
  error?: string;
  logs: string[];
}

export enum DeploymentStatus {
  PENDING = 'pending',
  VALIDATING = 'validating',
  DEPLOYING = 'deploying',
  COMPLETED = 'completed',
  FAILED = 'failed',
  ROLLING_BACK = 'rolling_back',
  ROLLED_BACK = 'rolled_back'
}

export interface DeployedResource {
  id: string;
  type: string;
  name: string;
  status: 'created' | 'updated' | 'failed';
  provider: string;
}

export interface CreateIacTemplateDto {
  name: string;
  description: string;
  type: IacTemplateType;
  category: string;
  tags: string[];
  content: string;
  variables: IacVariable[];
  outputs: IacOutput[];
  isPublic?: boolean;
}

export interface DeployTemplateDto {
  templateId: string;
  name: string;
  inputs: Record<string, any>;
}

export interface ApiEndpoint {
  method: string;
  path: string;
  description: string;
  scopes: ApiScope[];
  parameters?: ApiParameter[];
  requestBody?: any;
  responses: Record<string, any>;
}

export interface ApiParameter {
  name: string;
  in: 'path' | 'query' | 'header';
  required: boolean;
  type: string;
  description: string;
}

export interface ApiDocumentation {
  version: string;
  title: string;
  description: string;
  baseUrl: string;
  endpoints: ApiEndpoint[];
  authentication: {
    type: string;
    description: string;
  };
}
