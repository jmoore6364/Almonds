export interface Alert {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  condition: AlertCondition;
  actions: AlertAction[];
  resourceIds?: string[];
  triggerCount: number;
  lastTriggered?: Date;
  createdAt: Date;
  createdBy: string;
  enabled: boolean;
}

export enum AlertType {
  COST = 'cost',
  RESOURCE_STATUS = 'resource_status',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  HEALTH = 'health',
  CUSTOM = 'custom'
}

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
  EMERGENCY = 'emergency'
}

export enum AlertStatus {
  ACTIVE = 'active',
  TRIGGERED = 'triggered',
  RESOLVED = 'resolved',
  DISABLED = 'disabled',
  SNOOZED = 'snoozed'
}

export interface AlertCondition {
  metric: string;
  operator: ConditionOperator;
  threshold: number;
  timeWindow?: number; // in minutes
  aggregation?: 'avg' | 'sum' | 'min' | 'max' | 'count';
}

export enum ConditionOperator {
  GREATER_THAN = 'gt',
  GREATER_THAN_OR_EQUAL = 'gte',
  LESS_THAN = 'lt',
  LESS_THAN_OR_EQUAL = 'lte',
  EQUAL = 'eq',
  NOT_EQUAL = 'ne'
}

export interface AlertAction {
  type: AlertActionType;
  target: string; // email, webhook URL, etc.
  enabled: boolean;
  settings?: Record<string, any>;
}

export enum AlertActionType {
  EMAIL = 'email',
  SMS = 'sms',
  WEBHOOK = 'webhook',
  SLACK = 'slack',
  PUSH_NOTIFICATION = 'push',
  IN_APP = 'in_app'
}

export interface AlertHistory {
  id: string;
  alertId: string;
  triggeredAt: Date;
  resolvedAt?: Date;
  severity: AlertSeverity;
  message: string;
  details?: Record<string, any>;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

export interface Notification {
  id: string;
  organizationId: string;
  userId?: string;
  type: NotificationType;
  title: string;
  message: string;
  severity: AlertSeverity;
  read: boolean;
  actionUrl?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  expiresAt?: Date;
}

export enum NotificationType {
  ALERT = 'alert',
  SYSTEM = 'system',
  RESOURCE_UPDATE = 'resource_update',
  COST_ALERT = 'cost_alert',
  SECURITY = 'security',
  TEAM = 'team',
  BILLING = 'billing'
}

export interface CreateAlertDto {
  name: string;
  description: string;
  type: AlertType;
  severity: AlertSeverity;
  condition: AlertCondition;
  actions: AlertAction[];
  resourceIds?: string[];
  enabled?: boolean;
}

export interface NotificationPreferences {
  organizationId: string;
  userId: string;
  email: {
    enabled: boolean;
    alerts: boolean;
    costAlerts: boolean;
    securityAlerts: boolean;
    weeklyReports: boolean;
  };
  push: {
    enabled: boolean;
    alerts: boolean;
    criticalOnly: boolean;
  };
  inApp: {
    enabled: boolean;
    showBadge: boolean;
  };
  quietHours?: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string;
    timezone: string;
  };
}
