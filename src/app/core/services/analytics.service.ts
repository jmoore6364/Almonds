import { Injectable } from '@angular/core';
import { Observable, of, combineLatest } from 'rxjs';
import { map, delay } from 'rxjs/operators';

import {
  CostAnalytics,
  UsageAnalytics,
  TimeRange,
  BudgetAlert,
  CostOptimizationRecommendation,
  TimeSeriesDataPoint,
  AnalyticsQuery,
  CostBreakdown,
  ProviderCostBreakdown,
  ResourceTypeCostBreakdown,
  CostTrends,
  CostForecast,
  CostComparison,
  ResourceMetrics,
  GrowthMetrics,
  UtilizationMetrics
} from '../models/analytics.model';
import { CloudProvider, ResourceType } from '../models/resource.model';
import { ResourceService } from './resource.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  constructor(
    private resourceService: ResourceService,
    private authService: AuthService
  ) {}

  /**
   * Get comprehensive cost analytics
   */
  getCostAnalytics(timeRange: TimeRange = TimeRange.MONTH): Observable<CostAnalytics> {
    return combineLatest([
      this.authService.getCurrentOrganization(),
      this.resourceService.getAllResources()
    ]).pipe(
      map(([currentOrg, resources]) => {
        if (!currentOrg) {
          throw new Error('No organization selected');
        }

        const totalCost = resources.reduce((sum, r) => sum + (r.cost?.amount || 0), 0);

        return {
          organizationId: currentOrg.id,
          totalCost,
          currency: 'USD',
          period: timeRange,
          breakdown: this.calculateCostBreakdown(resources),
          trends: this.calculateCostTrends(totalCost, timeRange),
          forecast: this.calculateCostForecast(totalCost),
          comparisons: this.calculateCostComparison(totalCost)
        };
      }),
      delay(500)
    );
  }

  /**
   * Get usage analytics
   */
  getUsageAnalytics(timeRange: TimeRange = TimeRange.MONTH): Observable<UsageAnalytics> {
    return combineLatest([
      this.authService.getCurrentOrganization(),
      this.resourceService.getAllResources()
    ]).pipe(
      map(([currentOrg, resources]) => {
        if (!currentOrg) {
          throw new Error('No organization selected');
        }

        return {
          organizationId: currentOrg.id,
          period: timeRange,
          resourceMetrics: this.calculateResourceMetrics(resources),
          utilizationMetrics: this.calculateUtilizationMetrics(resources),
          performanceMetrics: {
            averageResponseTime: 145,
            uptime: 99.8,
            errorRate: 0.02,
            throughput: 15000,
            latency: {
              p50: 120,
              p90: 250,
              p95: 350,
              p99: 500,
              average: 145
            },
            availability: {
              uptime: 99.8,
              downtime: 14.4,
              incidents: 2,
              mttr: 12,
              mtbf: 360
            }
          }
        };
      }),
      delay(500)
    );
  }

  /**
   * Get budget alerts
   */
  getBudgetAlerts(): Observable<BudgetAlert[]> {
    return this.authService.getCurrentOrganization().pipe(
      map(currentOrg => {
        if (!currentOrg) return [];

        // Mock budget alerts
        return [
          {
            id: 'budget-1',
            organizationId: currentOrg.id,
            name: 'Monthly Cloud Budget',
            budgetAmount: 1000,
            currentSpend: 850,
            percentage: 85,
            threshold: 80,
            status: 'warning',
            period: TimeRange.MONTH,
            notifyEmails: ['admin@example.com'],
            createdAt: new Date('2024-01-01'),
            lastTriggered: new Date()
          },
          {
            id: 'budget-2',
            organizationId: currentOrg.id,
            name: 'AWS Budget',
            budgetAmount: 500,
            currentSpend: 234.50,
            percentage: 47,
            threshold: 75,
            status: 'ok',
            period: TimeRange.MONTH,
            notifyEmails: ['admin@example.com'],
            createdAt: new Date('2024-01-01')
          }
        ];
      }),
      delay(300)
    );
  }

  /**
   * Get cost optimization recommendations
   */
  getCostOptimizationRecommendations(): Observable<CostOptimizationRecommendation[]> {
    return this.authService.getCurrentOrganization().pipe(
      map(currentOrg => {
        if (!currentOrg) return [];

        return [
          {
            id: 'rec-1',
            type: 'unused_resources',
            title: 'Remove Unused Resources',
            description: '3 resources have been inactive for over 30 days',
            potentialSavings: 125.50,
            savingsPercentage: 27,
            effort: 'low',
            impact: 'medium',
            resourceIds: ['res-1', 'res-2', 'res-3'],
            actionItems: [
              'Review inactive resources',
              'Confirm resources are no longer needed',
              'Delete or archive resources'
            ],
            priority: 4,
            createdAt: new Date()
          },
          {
            id: 'rec-2',
            type: 'rightsizing',
            title: 'Rightsize Overprovisioned Instances',
            description: '2 EC2 instances are consistently underutilized (< 20% CPU)',
            potentialSavings: 89.00,
            savingsPercentage: 19,
            effort: 'medium',
            impact: 'medium',
            resourceIds: ['ec2-1', 'ec2-2'],
            actionItems: [
              'Analyze resource utilization patterns',
              'Downgrade to smaller instance types',
              'Monitor performance after changes'
            ],
            priority: 3,
            createdAt: new Date()
          },
          {
            id: 'rec-3',
            type: 'reserved_instances',
            title: 'Purchase Reserved Instances',
            description: 'Save up to 40% on 5 long-running instances',
            potentialSavings: 215.00,
            savingsPercentage: 42,
            effort: 'low',
            impact: 'high',
            resourceIds: ['ec2-3', 'ec2-4', 'ec2-5', 'rds-1', 'rds-2'],
            actionItems: [
              'Identify steady-state workloads',
              'Calculate ROI for reserved instances',
              'Purchase 1-year or 3-year reservations'
            ],
            priority: 5,
            createdAt: new Date()
          }
        ];
      }),
      delay(400)
    );
  }

  /**
   * Get time series data for charts
   */
  getTimeSeriesData(
    metricType: string,
    timeRange: TimeRange = TimeRange.MONTH
  ): Observable<TimeSeriesDataPoint[]> {
    const dataPoints: TimeSeriesDataPoint[] = [];
    const now = new Date();
    const days = this.getDaysForTimeRange(timeRange);

    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      dataPoints.push({
        timestamp: date,
        value: Math.random() * 100 + 50 + (Math.sin(i / 7) * 20),
        label: date.toLocaleDateString()
      });
    }

    return of(dataPoints).pipe(delay(300));
  }

  /**
   * Export analytics data
   */
  exportAnalytics(format: 'csv' | 'json' | 'pdf' | 'excel', query: AnalyticsQuery): Observable<Blob> {
    // Mock export - in production, this would generate actual files
    const mockData = JSON.stringify({
      query,
      exportedAt: new Date(),
      format
    });

    const blob = new Blob([mockData], { type: 'application/json' });
    return of(blob).pipe(delay(1000));
  }

  /**
   * Calculate cost breakdown
   */
  private calculateCostBreakdown(resources: any[]): CostBreakdown {
    const byProvider: ProviderCostBreakdown[] = [];
    const byResourceType: ResourceTypeCostBreakdown[] = [];
    const totalCost = resources.reduce((sum, r) => sum + (r.cost?.amount || 0), 0);

    // Group by provider
    const providerGroups = this.groupBy(resources, 'provider');
    Object.keys(providerGroups).forEach(provider => {
      const providerResources = providerGroups[provider];
      const cost = providerResources.reduce((sum: number, r: any) => sum + (r.cost?.amount || 0), 0);

      byProvider.push({
        provider: provider as CloudProvider,
        cost,
        percentage: totalCost > 0 ? (cost / totalCost) * 100 : 0,
        resourceCount: providerResources.length,
        trend: Math.random() * 20 - 10 // Mock trend
      });
    });

    // Group by type
    const typeGroups = this.groupBy(resources, 'type');
    Object.keys(typeGroups).forEach(type => {
      const typeResources = typeGroups[type];
      const cost = typeResources.reduce((sum: number, r: any) => sum + (r.cost?.amount || 0), 0);

      byResourceType.push({
        type: type as ResourceType,
        cost,
        percentage: totalCost > 0 ? (cost / totalCost) * 100 : 0,
        resourceCount: typeResources.length
      });
    });

    // Top resources
    const topResources = resources
      .filter(r => r.cost?.amount)
      .sort((a, b) => (b.cost?.amount || 0) - (a.cost?.amount || 0))
      .slice(0, 10)
      .map(r => ({
        resourceId: r.id,
        resourceName: r.name,
        provider: r.provider,
        type: r.type,
        cost: r.cost?.amount || 0,
        percentage: totalCost > 0 ? ((r.cost?.amount || 0) / totalCost) * 100 : 0
      }));

    return {
      byProvider,
      byResourceType,
      byTag: [],
      byRegion: [],
      topResources
    };
  }

  /**
   * Calculate cost trends
   */
  private calculateCostTrends(currentCost: number, timeRange: TimeRange): CostTrends {
    const daily: TimeSeriesDataPoint[] = [];
    const now = new Date();

    for (let i = 30; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      daily.push({
        timestamp: date,
        value: currentCost * (0.9 + Math.random() * 0.2),
        label: date.toLocaleDateString()
      });
    }

    return {
      daily,
      weekly: [],
      monthly: [],
      changePercentage: 5.3,
      changeAmount: currentCost * 0.053
    };
  }

  /**
   * Calculate cost forecast
   */
  private calculateCostForecast(currentCost: number): CostForecast {
    return {
      nextMonth: currentCost * 1.08,
      nextQuarter: currentCost * 3.25,
      nextYear: currentCost * 13.5,
      confidence: 85,
      trend: 'increasing'
    };
  }

  /**
   * Calculate cost comparison
   */
  private calculateCostComparison(currentCost: number): CostComparison {
    const previousCost = currentCost * 0.95;
    const change = currentCost - previousCost;

    return {
      previousPeriod: previousCost,
      percentageChange: (change / previousCost) * 100,
      amountChange: change,
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
    };
  }

  /**
   * Calculate resource metrics
   */
  private calculateResourceMetrics(resources: any[]): ResourceMetrics {
    const activeResources = resources.filter(r => r.status === 'active').length;
    const inactiveResources = resources.filter(r => r.status === 'inactive').length;
    const errorResources = resources.filter(r => r.status === 'error').length;

    const growth: GrowthMetrics = {
      newResources: Math.floor(Math.random() * 10),
      deletedResources: Math.floor(Math.random() * 5),
      netChange: 5,
      growthRate: 12.5,
      trend: []
    };

    return {
      totalResources: resources.length,
      activeResources,
      inactiveResources,
      errorResources,
      growth,
      distribution: {
        byProvider: [],
        byType: [],
        byRegion: [],
        byStatus: []
      }
    };
  }

  /**
   * Calculate utilization metrics
   */
  private calculateUtilizationMetrics(resources: any[]): UtilizationMetrics {
    return {
      overall: 65.3,
      byResourceType: [],
      byProvider: [],
      underutilized: [],
      overutilized: []
    };
  }

  /**
   * Helper: Group array by property
   */
  private groupBy(array: any[], property: string): Record<string, any[]> {
    return array.reduce((groups, item) => {
      const key = item[property];
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    }, {});
  }

  /**
   * Helper: Get number of days for time range
   */
  private getDaysForTimeRange(timeRange: TimeRange): number {
    switch (timeRange) {
      case TimeRange.TODAY:
        return 1;
      case TimeRange.WEEK:
        return 7;
      case TimeRange.MONTH:
        return 30;
      case TimeRange.QUARTER:
        return 90;
      case TimeRange.YEAR:
        return 365;
      default:
        return 30;
    }
  }
}
