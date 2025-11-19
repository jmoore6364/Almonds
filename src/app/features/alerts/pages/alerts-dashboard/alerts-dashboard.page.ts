import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { AlertService } from '@core/services/alert.service';
import { MonitoringService } from '@core/services/monitoring.service';
import { Alert, Notification, AlertSeverity, AlertStatus } from '@core/models/alert.model';
import { MonitoringDashboard } from '@core/models/monitoring.model';

@Component({
  selector: 'app-alerts-dashboard',
  templateUrl: './alerts-dashboard.page.html',
  styleUrls: ['./alerts-dashboard.page.scss']
})
export class AlertsDashboardPage implements OnInit {
  alerts$?: Observable<Alert[]>;
  recentNotifications$?: Observable<Notification[]>;
  monitoringDashboard$?: Observable<MonitoringDashboard>;
  activeAlertsCount$?: Observable<number>;
  unreadNotificationsCount$?: Observable<number>;

  constructor(
    private alertService: AlertService,
    private monitoringService: MonitoringService,
    private router: Router
  ) {}

  ngOnInit() {
    this.alerts$ = this.alertService.getActiveAlerts();
    this.recentNotifications$ = this.alertService.getNotifications().pipe(
      map(notifications => notifications.slice(0, 5))
    );
    this.monitoringDashboard$ = this.monitoringService.getMonitoringDashboard();
    this.activeAlertsCount$ = this.alertService.getActiveAlerts().pipe(
      map(alerts => alerts.length)
    );
    this.unreadNotificationsCount$ = this.alertService.getUnreadCount();
  }

  getSeverityColor(severity: AlertSeverity): string {
    const colors: { [key: string]: string } = {
      'info': 'primary',
      'warning': 'warning',
      'critical': 'danger',
      'emergency': 'danger'
    };
    return colors[severity] || 'medium';
  }

  getStatusColor(status: AlertStatus): string {
    const colors: { [key: string]: string } = {
      'active': 'success',
      'triggered': 'warning',
      'resolved': 'medium',
      'disabled': 'medium',
      'snoozed': 'medium'
    };
    return colors[status] || 'medium';
  }

  viewAllAlerts() {
    this.router.navigate(['/alerts/management']);
  }

  viewAllNotifications() {
    this.router.navigate(['/alerts/notifications']);
  }

  viewHealthMonitoring() {
    this.router.navigate(['/alerts/health-monitoring']);
  }

  async markNotificationAsRead(notificationId: string) {
    await this.alertService.markAsRead(notificationId).toPromise();
  }
}
