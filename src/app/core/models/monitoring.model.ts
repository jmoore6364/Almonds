export interface HealthCheck {
  id: string;
  organizationId: string;
  resourceId: string;
  name: string;
  type: HealthCheckType;
  endpoint?: string;
  interval: number; // in minutes
  timeout: number; // in seconds
  enabled: boolean;
  status: HealthStatus;
  lastCheck?: Date;
  nextCheck?: Date;
  consecutiveFailures: number;
  createdAt: Date;
}

export enum HealthCheckType {
  HTTP = 'http',
  HTTPS = 'https',
  TCP = 'tcp',
  PING = 'ping',
  DNS = 'dns',
  DATABASE = 'database',
  API = 'api',
  CUSTOM = 'custom'
}

export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
  UNKNOWN = 'unknown',
  CHECKING = 'checking'
}

export interface HealthCheckResult {
  id: string;
  healthCheckId: string;
  timestamp: Date;
  status: HealthStatus;
  responseTime: number; // in milliseconds
  statusCode?: number;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface UptimeMetrics {
  resourceId: string;
  period: TimePeriod;
  uptime: number; // percentage
  downtime: number; // in minutes
  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;
  averageResponseTime: number;
  incidents: UptimeIncident[];
}

export enum TimePeriod {
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
  CUSTOM = 'custom'
}

export interface UptimeIncident {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in minutes
  status: HealthStatus;
  impactedChecks: number;
  rootCause?: string;
  resolved: boolean;
}

export interface ServiceStatus {
  organizationId: string;
  resourceId: string;
  resourceName: string;
  provider: string;
  currentStatus: HealthStatus;
  uptime24h: number;
  uptime7d: number;
  uptime30d: number;
  lastIncident?: UptimeIncident;
  activeHealthChecks: number;
  lastChecked?: Date;
}

export interface StatusPage {
  organizationId: string;
  title: string;
  description?: string;
  services: ServiceStatus[];
  incidents: UptimeIncident[];
  overallStatus: HealthStatus;
  lastUpdated: Date;
}

export interface MonitoringDashboard {
  organizationId: string;
  totalServices: number;
  healthyServices: number;
  degradedServices: number;
  unhealthyServices: number;
  activeIncidents: number;
  resolvedIncidentsToday: number;
  averageUptime: number;
  averageResponseTime: number;
  topIncidents: UptimeIncident[];
  serviceStatuses: ServiceStatus[];
}

export interface CreateHealthCheckDto {
  resourceId: string;
  name: string;
  type: HealthCheckType;
  endpoint?: string;
  interval: number;
  timeout: number;
  enabled?: boolean;
}

export interface PerformanceMetric {
  id: string;
  resourceId: string;
  timestamp: Date;
  metric: string;
  value: number;
  unit: string;
  tags?: Record<string, string>;
}

export interface ResourceMetrics {
  resourceId: string;
  period: TimePeriod;
  metrics: {
    cpu?: MetricTimeSeries;
    memory?: MetricTimeSeries;
    disk?: MetricTimeSeries;
    network?: MetricTimeSeries;
    requests?: MetricTimeSeries;
    errors?: MetricTimeSeries;
    latency?: MetricTimeSeries;
  };
}

export interface MetricTimeSeries {
  name: string;
  unit: string;
  dataPoints: DataPoint[];
  average: number;
  min: number;
  max: number;
}

export interface DataPoint {
  timestamp: Date;
  value: number;
}
