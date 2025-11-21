import { IsString, IsOptional, IsObject, IsEnum } from 'class-validator';

export enum AuditAction {
  // Authentication
  USER_LOGIN = 'user.login',
  USER_LOGOUT = 'user.logout',
  USER_REGISTER = 'user.register',
  USER_PASSWORD_RESET = 'user.password_reset',
  USER_EMAIL_VERIFY = 'user.email_verify',
  USER_2FA_ENABLE = 'user.2fa_enable',
  USER_2FA_DISABLE = 'user.2fa_disable',

  // User Management
  USER_UPDATE = 'user.update',
  USER_DELETE = 'user.delete',

  // Organization Management
  ORG_CREATE = 'org.create',
  ORG_UPDATE = 'org.update',
  ORG_DELETE = 'org.delete',
  ORG_MEMBER_ADD = 'org.member_add',
  ORG_MEMBER_REMOVE = 'org.member_remove',
  ORG_MEMBER_ROLE_CHANGE = 'org.member_role_change',

  // Resource Management
  RESOURCE_CREATE = 'resource.create',
  RESOURCE_UPDATE = 'resource.update',
  RESOURCE_DELETE = 'resource.delete',
  RESOURCE_START = 'resource.start',
  RESOURCE_STOP = 'resource.stop',
  RESOURCE_RESTART = 'resource.restart',

  // Cloud Provider Management
  PROVIDER_ADD = 'provider.add',
  PROVIDER_UPDATE = 'provider.update',
  PROVIDER_DELETE = 'provider.delete',
  PROVIDER_SYNC = 'provider.sync',

  // API Key Management
  API_KEY_CREATE = 'api_key.create',
  API_KEY_UPDATE = 'api_key.update',
  API_KEY_REVOKE = 'api_key.revoke',
  API_KEY_DELETE = 'api_key.delete',

  // Webhook Management
  WEBHOOK_CREATE = 'webhook.create',
  WEBHOOK_UPDATE = 'webhook.update',
  WEBHOOK_DELETE = 'webhook.delete',
  WEBHOOK_TEST = 'webhook.test',

  // Billing & Subscription
  SUBSCRIPTION_CREATE = 'subscription.create',
  SUBSCRIPTION_UPDATE = 'subscription.update',
  SUBSCRIPTION_CANCEL = 'subscription.cancel',
  PAYMENT_SUCCESS = 'payment.success',
  PAYMENT_FAILED = 'payment.failed',

  // Security
  SECURITY_POLICY_UPDATE = 'security.policy_update',
  ACCESS_DENIED = 'security.access_denied',
  SUSPICIOUS_ACTIVITY = 'security.suspicious_activity',

  // IaC
  IAC_TEMPLATE_CREATE = 'iac.template_create',
  IAC_TEMPLATE_UPDATE = 'iac.template_update',
  IAC_TEMPLATE_DELETE = 'iac.template_delete',
  IAC_DEPLOYMENT_START = 'iac.deployment_start',
  IAC_DEPLOYMENT_COMPLETE = 'iac.deployment_complete',
  IAC_DEPLOYMENT_FAILED = 'iac.deployment_failed',

  // Settings
  SETTINGS_UPDATE = 'settings.update',
  NOTIFICATION_SETTINGS_UPDATE = 'settings.notification_update',
}

export enum AuditStatus {
  SUCCESS = 'success',
  FAILURE = 'failure',
}

export class CreateAuditLogDto {
  @IsString()
  organizationId: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsEnum(AuditAction)
  action: AuditAction;

  @IsOptional()
  @IsString()
  resource?: string;

  @IsOptional()
  @IsString()
  resourceId?: string;

  @IsOptional()
  @IsObject()
  details?: Record<string, any>;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsEnum(AuditStatus)
  status?: AuditStatus;
}
