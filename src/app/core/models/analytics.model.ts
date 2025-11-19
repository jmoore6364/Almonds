import { CloudProvider, ResourceType } from './resource.model';

export enum TimeRange {
  TODAY = 'today',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
  CUSTOM = 'custom'
}

export enum MetricType {
  COST = 'cost',
  USAGE = 'usage',
  PERFORMANCE = 'performance',
  AVAILABILITY = 'availability'
}

export interface TimeSeriesDataPoint {
  timestamp: Date;
  value: number;
  label?: string;
  metadata?: Record<string, any>;
}

export interface CostAnalytics {
  organizationId: string;
  totalCost: number;
  currency: string;
  period: TimeRange;
  breakdown: CostBreakdown;
  trends: CostTrends;
  forecast: CostForecast;
  comparisons: CostComparison;
}

export interface CostBreakdown {
  byProvider: ProviderCostBreakdown[];
  byResourceType: ResourceTypeCostBreakdown[];
  byTag: TagCostBreakdown[];
  byRegion: RegionCostBreakdown[];
  topResources: ResourceCostItem[];
}

export interface ProviderCostBreakdown {
  provider: CloudProvider;
  cost: number;
  percentage: number;
  resourceCount: number;
  trend: number; // percentage change
}

export interface ResourceTypeCostBreakdown {
  type: ResourceType;
  cost: number;
  percentage: number;
  resourceCount: number;
}

export interface TagCostBreakdown {
  tag: string;
  value: string;
  cost: number;
  percentage: number;
}

export interface RegionCostBreakdown {
  region: string;
  cost: number;
  percentage: number;
  resourceCount: number;
}

export interface ResourceCostItem {
  resourceId: string;
  resourceName: string;
  provider: CloudProvider;
  type: ResourceType;
  cost: number;
  percentage: number;
}

export interface CostTrends {
  daily: TimeSeriesDataPoint[];
  weekly: TimeSeriesDataPoint[];
  monthly: TimeSeriesDataPoint[];
  changePercentage: number;
  changeAmount: number;
}

export interface CostForecast {
  nextMonth: number;
  nextQuarter: number;
  nextYear: number;
  confidence: number; // 0-100
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface CostComparison {
  previousPeriod: number;
  percentageChange: number;
  amountChange: number;
  direction: 'up' | 'down' | 'stable';
}

export interface UsageAnalytics {
  organizationId: string;
  period: TimeRange;
  resourceMetrics: ResourceMetrics;
  utilizationMetrics: UtilizationMetrics;
  performanceMetrics: PerformanceMetrics;
}

export interface ResourceMetrics {
  totalResources: number;
  activeResources: number;
  inactiveResources: number;
  errorResources: number;
  growth: GrowthMetrics;
  distribution: ResourceDistribution;
}

export interface GrowthMetrics {
  newResources: number;
  deletedResources: number;
  netChange: number;
  growthRate: number;
  trend: TimeSeriesDataPoint[];
}

export interface ResourceDistribution {
  byProvider: { provider: CloudProvider; count: number; percentage: number }[];
  byType: { type: ResourceType; count: number; percentage: number }[];
  byRegion: { region: string; count: number; percentage: number }[];
  byStatus: { status: string; count: number; percentage: number }[];
}

export interface UtilizationMetrics {
  overall: number; // 0-100
  byResourceType: TypeUtilization[];
  byProvider: ProviderUtilization[];
  underutilized: UnderutilizedResource[];
  overutilized: OverutilizedResource[];
}

export interface TypeUtilization {
  type: ResourceType;
  utilization: number;
  resourceCount: number;
  recommendations: string[];
}

export interface ProviderUtilization {
  provider: CloudProvider;
  utilization: number;
  resourceCount: number;
}

export interface UnderutilizedResource {
  resourceId: string;
  resourceName: string;
  utilization: number;
  potentialSavings: number;
  recommendation: string;
}

export interface OverutilizedResource {
  resourceId: string;
  resourceName: string;
  utilization: number;
  recommendation: string;
}

export interface PerformanceMetrics {
  averageResponseTime: number;
  uptime: number; // percentage
  errorRate: number; // percentage
  throughput: number;
  latency: LatencyMetrics;
  availability: AvailabilityMetrics;
}

export interface LatencyMetrics {
  p50: number;
  p90: number;
  p95: number;
  p99: number;
  average: number;
}

export interface AvailabilityMetrics {
  uptime: number; // percentage
  downtime: number; // minutes
  incidents: number;
  mttr: number; // mean time to recovery (minutes)
  mtbf: number; // mean time between failures (hours)
}

export interface BudgetAlert {
  id: string;
  organizationId: string;
  name: string;
  budgetAmount: number;
  currentSpend: number;
  percentage: number;
  threshold: number;
  status: 'ok' | 'warning' | 'exceeded';
  period: TimeRange;
  notifyEmails: string[];
  createdAt: Date;
  lastTriggered?: Date;
}

export interface CostOptimizationRecommendation {
  id: string;
  type: 'rightsizing' | 'reserved_instances' | 'spot_instances' | 'unused_resources' | 'scheduling';
  title: string;
  description: string;
  potentialSavings: number;
  savingsPercentage: number;
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  resourceIds: string[];
  actionItems: string[];
  priority: number; // 1-5
  createdAt: Date;
}

export interface CustomDashboard {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  widgets: DashboardWidget[];
  layout: DashboardLayout;
  isDefault: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardWidget {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'list';
  title: string;
  dataSource: string;
  config: WidgetConfig;
  position: WidgetPosition;
}

export interface WidgetConfig {
  chartType?: 'line' | 'bar' | 'pie' | 'donut' | 'area';
  metricType?: MetricType;
  timeRange?: TimeRange;
  filters?: Record<string, any>;
  aggregation?: 'sum' | 'avg' | 'min' | 'max' | 'count';
  groupBy?: string;
}

export interface WidgetPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DashboardLayout {
  columns: number;
  rowHeight: number;
  gaps: number;
}

export interface AnalyticsQuery {
  organizationId: string;
  metricType: MetricType;
  timeRange: TimeRange;
  startDate?: Date;
  endDate?: Date;
  providers?: CloudProvider[];
  resourceTypes?: ResourceType[];
  regions?: string[];
  tags?: Record<string, string>;
  groupBy?: 'provider' | 'type' | 'region' | 'tag';
  aggregation?: 'sum' | 'avg' | 'min' | 'max';
}

export interface AnalyticsExport {
  format: 'csv' | 'json' | 'pdf' | 'excel';
  data: any;
  filename: string;
  generatedAt: Date;
}
