import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AnalyticsDashboardPage } from './pages/analytics-dashboard/analytics-dashboard.page';
import { CostAnalyticsPage } from './pages/cost-analytics/cost-analytics.page';
import { UsageAnalyticsPage } from './pages/usage-analytics/usage-analytics.page';
import { OptimizationPage } from './pages/optimization/optimization.page';

const routes: Routes = [
  {
    path: '',
    component: AnalyticsDashboardPage
  },
  {
    path: 'costs',
    component: CostAnalyticsPage
  },
  {
    path: 'usage',
    component: UsageAnalyticsPage
  },
  {
    path: 'optimization',
    component: OptimizationPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AnalyticsRoutingModule {}
