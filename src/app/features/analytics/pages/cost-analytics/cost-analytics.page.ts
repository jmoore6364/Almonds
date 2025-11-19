import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';

import { AnalyticsService } from '@core/services/analytics.service';
import { CostAnalytics, TimeRange, TimeSeriesDataPoint } from '@core/models/analytics.model';

@Component({
  selector: 'app-cost-analytics',
  templateUrl: './cost-analytics.page.html',
  styleUrls: ['./cost-analytics.page.scss']
})
export class CostAnalyticsPage implements OnInit {
  costAnalytics$?: Observable<CostAnalytics>;
  costTrend$?: Observable<TimeSeriesDataPoint[]>;
  selectedTimeRange: TimeRange = TimeRange.MONTH;

  constructor(private analyticsService: AnalyticsService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.costAnalytics$ = this.analyticsService.getCostAnalytics(this.selectedTimeRange);
    this.costTrend$ = this.analyticsService.getTimeSeriesData('cost', this.selectedTimeRange);
  }

  exportData() {
    // Export functionality
    console.log('Exporting cost analytics data...');
  }
}
