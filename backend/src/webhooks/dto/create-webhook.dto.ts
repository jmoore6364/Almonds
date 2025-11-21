import { IsString, IsUrl, IsArray, IsOptional, IsObject, IsBoolean, IsEnum, IsInt, Min, Max } from 'class-validator';

export enum WebhookEvent {
  // Resource events
  RESOURCE_CREATED = 'resource.created',
  RESOURCE_UPDATED = 'resource.updated',
  RESOURCE_DELETED = 'resource.deleted',
  RESOURCE_STATUS_CHANGED = 'resource.status_changed',

  // Organization events
  ORGANIZATION_UPDATED = 'organization.updated',
  ORGANIZATION_MEMBER_ADDED = 'organization.member_added',
  ORGANIZATION_MEMBER_REMOVED = 'organization.member_removed',

  // Billing events
  SUBSCRIPTION_CREATED = 'subscription.created',
  SUBSCRIPTION_UPDATED = 'subscription.updated',
  SUBSCRIPTION_CANCELED = 'subscription.canceled',
  PAYMENT_SUCCEEDED = 'payment.succeeded',
  PAYMENT_FAILED = 'payment.failed',

  // Alert events
  ALERT_TRIGGERED = 'alert.triggered',
  ALERT_RESOLVED = 'alert.resolved',

  // Workflow events
  WORKFLOW_STARTED = 'workflow.started',
  WORKFLOW_COMPLETED = 'workflow.completed',
  WORKFLOW_FAILED = 'workflow.failed',

  // IAC events
  IAC_DEPLOYMENT_STARTED = 'iac.deployment_started',
  IAC_DEPLOYMENT_COMPLETED = 'iac.deployment_completed',
  IAC_DEPLOYMENT_FAILED = 'iac.deployment_failed',

  // Health check events
  HEALTH_CHECK_FAILED = 'health_check.failed',
  HEALTH_CHECK_RECOVERED = 'health_check.recovered',
}

export class WebhookRetryConfig {
  @IsInt()
  @Min(0)
  @Max(10)
  maxRetries: number = 3;

  @IsInt()
  @Min(100)
  @Max(60000)
  retryDelayMs: number = 1000;

  @IsInt()
  @Min(1)
  @Max(10)
  backoffMultiplier: number = 2;

  @IsInt()
  @Min(1000)
  @Max(60000)
  timeout: number = 5000;
}

export class CreateWebhookDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsUrl()
  url: string;

  @IsArray()
  @IsEnum(WebhookEvent, { each: true })
  events: WebhookEvent[];

  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;

  @IsOptional()
  @IsObject()
  retryConfig?: WebhookRetryConfig;
}

export class UpdateWebhookDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUrl()
  url?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(WebhookEvent, { each: true})
  events?: WebhookEvent[];

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;

  @IsOptional()
  @IsObject()
  retryConfig?: WebhookRetryConfig;
}

export class TestWebhookDto {
  @IsOptional()
  @IsEnum(WebhookEvent)
  event?: WebhookEvent = WebhookEvent.RESOURCE_CREATED;

  @IsOptional()
  @IsObject()
  payload?: Record<string, any>;
}
