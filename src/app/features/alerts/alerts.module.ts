import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { AlertsRoutingModule } from './alerts-routing.module';
import { AlertsDashboardPage } from './pages/alerts-dashboard/alerts-dashboard.page';
import { AlertsManagementPage } from './pages/alerts-management/alerts-management.page';
import { NotificationsPage } from './pages/notifications/notifications.page';
import { HealthMonitoringPage } from './pages/health-monitoring/health-monitoring.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    AlertsRoutingModule
  ],
  declarations: [
    AlertsDashboardPage,
    AlertsManagementPage,
    NotificationsPage,
    HealthMonitoringPage
  ]
})
export class AlertsModule {}
