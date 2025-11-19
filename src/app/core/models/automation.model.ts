export interface Workflow {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  enabled: boolean;
  trigger: WorkflowTrigger;
  actions: WorkflowAction[];
  conditions?: WorkflowCondition[];
  executionCount: number;
  lastExecuted?: Date;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
}

export interface WorkflowTrigger {
  type: TriggerType;
  config: TriggerConfig;
}

export enum TriggerType {
  SCHEDULE = 'schedule',
  EVENT = 'event',
  WEBHOOK = 'webhook',
  MANUAL = 'manual',
  ALERT = 'alert',
  METRIC_THRESHOLD = 'metric_threshold'
}

export interface TriggerConfig {
  // For schedule triggers
  cron?: string;
  timezone?: string;

  // For event triggers
  eventType?: string;
  resourceType?: string;

  // For webhook triggers
  webhookUrl?: string;
  secret?: string;

  // For metric threshold triggers
  metric?: string;
  threshold?: number;
  operator?: string;

  // Common
  metadata?: Record<string, any>;
}

export interface WorkflowAction {
  id: string;
  type: ActionType;
  config: ActionConfig;
  orderIndex: number;
  continueOnError: boolean;
}

export enum ActionType {
  START_RESOURCE = 'start_resource',
  STOP_RESOURCE = 'stop_resource',
  RESTART_RESOURCE = 'restart_resource',
  SCALE_RESOURCE = 'scale_resource',
  BACKUP_RESOURCE = 'backup_resource',
  SEND_NOTIFICATION = 'send_notification',
  WEBHOOK_CALL = 'webhook_call',
  RUN_SCRIPT = 'run_script',
  CREATE_SNAPSHOT = 'create_snapshot',
  DELETE_SNAPSHOT = 'delete_snapshot',
  UPDATE_TAGS = 'update_tags'
}

export interface ActionConfig {
  resourceIds?: string[];
  scaleConfig?: {
    instanceCount?: number;
    instanceType?: string;
    cpuUnits?: number;
    memoryMb?: number;
  };
  notificationConfig?: {
    recipients: string[];
    message: string;
    channel: string;
  };
  webhookConfig?: {
    url: string;
    method: string;
    headers?: Record<string, string>;
    body?: any;
  };
  scriptConfig?: {
    script: string;
    language: string;
    timeout?: number;
  };
  metadata?: Record<string, any>;
}

export interface WorkflowCondition {
  type: ConditionType;
  field: string;
  operator: string;
  value: any;
}

export enum ConditionType {
  RESOURCE_STATUS = 'resource_status',
  METRIC_VALUE = 'metric_value',
  TIME_RANGE = 'time_range',
  DAY_OF_WEEK = 'day_of_week',
  COST_THRESHOLD = 'cost_threshold',
  CUSTOM = 'custom'
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: ExecutionStatus;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  triggeredBy: string;
  results: ActionResult[];
  error?: string;
}

export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  PARTIAL = 'partial'
}

export interface ActionResult {
  actionId: string;
  status: ExecutionStatus;
  startTime: Date;
  endTime?: Date;
  output?: any;
  error?: string;
}

export interface ScheduledTask {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  enabled: boolean;
  schedule: TaskSchedule;
  action: WorkflowAction;
  resourceIds: string[];
  lastRun?: Date;
  nextRun?: Date;
  executionCount: number;
  createdAt: Date;
  createdBy: string;
}

export interface TaskSchedule {
  type: ScheduleType;
  cron?: string;
  interval?: number; // in minutes
  timezone: string;
  startDate?: Date;
  endDate?: Date;
  daysOfWeek?: number[]; // 0-6, Sunday-Saturday
  excludeHolidays?: boolean;
}

export enum ScheduleType {
  CRON = 'cron',
  INTERVAL = 'interval',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  ONCE = 'once'
}

export interface AutoScalingPolicy {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  enabled: boolean;
  resourceIds: string[];
  scaleUpRules: ScalingRule[];
  scaleDownRules: ScalingRule[];
  minInstances: number;
  maxInstances: number;
  cooldownPeriod: number; // in minutes
  lastScaled?: Date;
  createdAt: Date;
  createdBy: string;
}

export interface ScalingRule {
  metric: string;
  threshold: number;
  operator: string;
  duration: number; // in minutes
  scaleBy: number; // number of instances or percentage
  scaleType: 'absolute' | 'percentage';
}

export interface ScalingEvent {
  id: string;
  policyId: string;
  resourceId: string;
  type: 'scale_up' | 'scale_down';
  fromCount: number;
  toCount: number;
  reason: string;
  triggeredBy: string;
  timestamp: Date;
  success: boolean;
  error?: string;
}

export interface CreateWorkflowDto {
  name: string;
  description: string;
  trigger: WorkflowTrigger;
  actions: Omit<WorkflowAction, 'id'>[];
  conditions?: WorkflowCondition[];
  enabled?: boolean;
}

export interface CreateScheduledTaskDto {
  name: string;
  description: string;
  schedule: TaskSchedule;
  action: Omit<WorkflowAction, 'id'>;
  resourceIds: string[];
  enabled?: boolean;
}

export interface CreateAutoScalingPolicyDto {
  name: string;
  description: string;
  resourceIds: string[];
  scaleUpRules: ScalingRule[];
  scaleDownRules: ScalingRule[];
  minInstances: number;
  maxInstances: number;
  cooldownPeriod: number;
  enabled?: boolean;
}
