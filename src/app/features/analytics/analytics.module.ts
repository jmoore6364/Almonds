import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

import { AnalyticsRoutingModule } from './analytics-routing.module';
import { AnalyticsDashboardPage } from './pages/analytics-dashboard/analytics-dashboard.page';
import { CostAnalyticsPage } from './pages/cost-analytics/cost-analytics.page';
import { UsageAnalyticsPage } from './pages/usage-analytics/usage-analytics.page';
import { OptimizationPage } from './pages/optimization/optimization.page';

@NgModule({
  declarations: [
    AnalyticsDashboardPage,
    CostAnalyticsPage,
    UsageAnalyticsPage,
    OptimizationPage
  ],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AnalyticsRoutingModule
  ]
})
export class AnalyticsModule {}
