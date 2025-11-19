import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AlertsDashboardPage } from './pages/alerts-dashboard/alerts-dashboard.page';
import { AlertsManagementPage } from './pages/alerts-management/alerts-management.page';
import { NotificationsPage } from './pages/notifications/notifications.page';
import { HealthMonitoringPage } from './pages/health-monitoring/health-monitoring.page';

const routes: Routes = [
  {
    path: '',
    component: AlertsDashboardPage
  },
  {
    path: 'management',
    component: AlertsManagementPage
  },
  {
    path: 'notifications',
    component: NotificationsPage
  },
  {
    path: 'health-monitoring',
    component: HealthMonitoringPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AlertsRoutingModule {}
