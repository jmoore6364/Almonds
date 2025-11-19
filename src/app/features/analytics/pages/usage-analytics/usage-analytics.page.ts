import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';

import { AnalyticsService } from '@core/services/analytics.service';
import { UsageAnalytics, TimeRange } from '@core/models/analytics.model';

@Component({
  selector: 'app-usage-analytics',
  templateUrl: './usage-analytics.page.html',
  styleUrls: ['./usage-analytics.page.scss']
})
export class UsageAnalyticsPage implements OnInit {
  usageAnalytics$?: Observable<UsageAnalytics>;
  selectedTimeRange: TimeRange = TimeRange.MONTH;

  constructor(private analyticsService: AnalyticsService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.usageAnalytics$ = this.analyticsService.getUsageAnalytics(this.selectedTimeRange);
  }
}
