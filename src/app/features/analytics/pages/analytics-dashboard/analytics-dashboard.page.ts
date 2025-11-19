import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

import { AnalyticsService } from '@core/services/analytics.service';
import {
  CostAnalytics,
  UsageAnalytics,
  TimeRange,
  BudgetAlert,
  CostOptimizationRecommendation
} from '@core/models/analytics.model';

@Component({
  selector: 'app-analytics-dashboard',
  templateUrl: './analytics-dashboard.page.html',
  styleUrls: ['./analytics-dashboard.page.scss']
})
export class AnalyticsDashboardPage implements OnInit {
  costAnalytics$?: Observable<CostAnalytics>;
  usageAnalytics$?: Observable<UsageAnalytics>;
  budgetAlerts$?: Observable<BudgetAlert[]>;
  recommendations$?: Observable<CostOptimizationRecommendation[]>;

  selectedTimeRange: TimeRange = TimeRange.MONTH;
  timeRanges = [
    { value: TimeRange.TODAY, label: 'Today' },
    { value: TimeRange.WEEK, label: 'This Week' },
    { value: TimeRange.MONTH, label: 'This Month' },
    { value: TimeRange.QUARTER, label: 'This Quarter' },
    { value: TimeRange.YEAR, label: 'This Year' }
  ];

  constructor(
    private router: Router,
    private analyticsService: AnalyticsService
  ) {}

  ngOnInit() {
    this.loadAnalytics();
  }

  loadAnalytics() {
    this.costAnalytics$ = this.analyticsService.getCostAnalytics(this.selectedTimeRange);
    this.usageAnalytics$ = this.analyticsService.getUsageAnalytics(this.selectedTimeRange);
    this.budgetAlerts$ = this.analyticsService.getBudgetAlerts();
    this.recommendations$ = this.analyticsService.getCostOptimizationRecommendations();
  }

  onTimeRangeChange(event: any) {
    this.selectedTimeRange = event.detail.value;
    this.loadAnalytics();
  }

  viewCostDetails() {
    this.router.navigate(['/analytics/costs']);
  }

  viewUsageDetails() {
    this.router.navigate(['/analytics/usage']);
  }

  viewOptimization() {
    this.router.navigate(['/analytics/optimization']);
  }

  getAlertColor(status: string): string {
    switch (status) {
      case 'ok':
        return 'success';
      case 'warning':
        return 'warning';
      case 'exceeded':
        return 'danger';
      default:
        return 'medium';
    }
  }

  getEffortColor(effort: string): string {
    switch (effort) {
      case 'low':
        return 'success';
      case 'medium':
        return 'warning';
      case 'high':
        return 'danger';
      default:
        return 'medium';
    }
  }

  getPriorityStars(priority: number): string[] {
    return Array(priority).fill('star');
  }
}
