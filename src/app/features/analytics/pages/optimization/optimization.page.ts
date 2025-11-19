import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';

import { AnalyticsService } from '@core/services/analytics.service';
import { CostOptimizationRecommendation } from '@core/models/analytics.model';

@Component({
  selector: 'app-optimization',
  templateUrl: './optimization.page.html',
  styleUrls: ['./optimization.page.scss']
})
export class OptimizationPage implements OnInit {
  recommendations$?: Observable<CostOptimizationRecommendation[]>;

  constructor(private analyticsService: AnalyticsService) {}

  ngOnInit() {
    this.recommendations$ = this.analyticsService.getCostOptimizationRecommendations();
  }

  getEffortColor(effort: string): string {
    const colors: { [key: string]: string } = {
      'low': 'success',
      'medium': 'warning',
      'high': 'danger'
    };
    return colors[effort] || 'medium';
  }

  getImpactColor(impact: string): string {
    const colors: { [key: string]: string } = {
      'low': 'medium',
      'medium': 'warning',
      'high': 'success'
    };
    return colors[impact] || 'medium';
  }

  getPriorityStars(priority: number): string[] {
    return Array(priority).fill('star');
  }
}
