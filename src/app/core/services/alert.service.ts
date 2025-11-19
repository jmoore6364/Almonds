import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, interval } from 'rxjs';
import { map, delay } from 'rxjs/operators';

import {
  Alert,
  AlertHistory,
  Notification,
  CreateAlertDto,
  AlertType,
  AlertSeverity,
  AlertStatus,
  NotificationType,
  NotificationPreferences,
  ConditionOperator
} from '@core/models/alert.model';
import { AuthService } from './auth.service';
import { ResourceService } from './resource.service';

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private alertsSubject = new BehaviorSubject<Alert[]>([]);
  private allAlertsSubject = new BehaviorSubject<Alert[]>([]);
  private alertHistorySubject = new BehaviorSubject<AlertHistory[]>([]);
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private allNotificationsSubject = new BehaviorSubject<Notification[]>([]);

  alerts$: Observable<Alert[]>;
  alertHistory$: Observable<AlertHistory[]>;
  notifications$: Observable<Notification[]>;

  constructor(
    private authService: AuthService,
    private resourceService: ResourceService
  ) {
    // Filter alerts by current organization
    this.alerts$ = combineLatest([
      this.allAlertsSubject.asObservable(),
      this.authService.getCurrentOrganization()
    ]).pipe(
      map(([alerts, currentOrg]) => {
        if (!currentOrg) return [];
        return alerts.filter(a => a.organizationId === currentOrg.id);
      })
    );

    // Filter notifications by current organization
    this.notifications$ = combineLatest([
      this.allNotificationsSubject.asObservable(),
      this.authService.getCurrentOrganization()
    ]).pipe(
      map(([notifications, currentOrg]) => {
        if (!currentOrg) return [];
        return notifications.filter(n => n.organizationId === currentOrg.id);
      })
    );

    this.alertHistory$ = this.alertHistorySubject.asObservable();

    this.initializeMockData();
    this.startAlertMonitoring();
  }

  private initializeMockData(): void {
    const mockAlerts: Alert[] = [
      {
        id: 'alert-1',
        organizationId: 'org-1',
        name: 'High Cost Alert',
        description: 'Alert when monthly cost exceeds $1000',
        type: AlertType.COST,
        severity: AlertSeverity.WARNING,
        status: AlertStatus.ACTIVE,
        condition: {
          metric: 'monthly_cost',
          operator: ConditionOperator.GREATER_THAN,
          threshold: 1000
        },
        actions: [
          {
            type: 'email',
            target: 'admin@example.com',
            enabled: true
          },
          {
            type: 'in_app',
            target: 'all',
            enabled: true
          }
        ],
        triggerCount: 3,
        lastTriggered: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        createdBy: 'user-1',
        enabled: true
      },
      {
        id: 'alert-2',
        organizationId: 'org-1',
        name: 'Resource Down',
        description: 'Alert when any resource status becomes inactive',
        type: AlertType.RESOURCE_STATUS,
        severity: AlertSeverity.CRITICAL,
        status: AlertStatus.ACTIVE,
        condition: {
          metric: 'resource_status',
          operator: ConditionOperator.EQUAL,
          threshold: 0 // 0 = inactive
        },
        actions: [
          {
            type: 'email',
            target: 'ops@example.com',
            enabled: true
          },
          {
            type: 'slack',
            target: 'https://hooks.slack.com/services/xxx',
            enabled: true
          }
        ],
        triggerCount: 1,
        lastTriggered: new Date(Date.now() - 5 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        createdBy: 'user-1',
        enabled: true
      },
      {
        id: 'alert-3',
        organizationId: 'org-1',
        name: 'High Response Time',
        description: 'Alert when average response time exceeds 500ms',
        type: AlertType.PERFORMANCE,
        severity: AlertSeverity.WARNING,
        status: AlertStatus.ACTIVE,
        condition: {
          metric: 'avg_response_time',
          operator: ConditionOperator.GREATER_THAN,
          threshold: 500,
          timeWindow: 15,
          aggregation: 'avg'
        },
        actions: [
          {
            type: 'email',
            target: 'dev@example.com',
            enabled: true
          }
        ],
        triggerCount: 0,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        createdBy: 'user-2',
        enabled: true
      }
    ];

    const mockNotifications: Notification[] = [
      {
        id: 'notif-1',
        organizationId: 'org-1',
        type: NotificationType.ALERT,
        title: 'High Cost Alert Triggered',
        message: 'Your monthly cost has exceeded $1000. Current cost: $1,245.50',
        severity: AlertSeverity.WARNING,
        read: false,
        actionUrl: '/analytics/cost-analytics',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        id: 'notif-2',
        organizationId: 'org-1',
        type: NotificationType.RESOURCE_UPDATE,
        title: 'Resource Status Changed',
        message: 'Production Database (AWS RDS) status changed to inactive',
        severity: AlertSeverity.CRITICAL,
        read: false,
        actionUrl: '/resources',
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000)
      },
      {
        id: 'notif-3',
        organizationId: 'org-1',
        type: NotificationType.SYSTEM,
        title: 'New Team Member',
        message: 'John Doe has joined your organization as a Developer',
        severity: AlertSeverity.INFO,
        read: true,
        actionUrl: '/organization/team-members',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }
    ];

    this.allAlertsSubject.next(mockAlerts);
    this.allNotificationsSubject.next(mockNotifications);
  }

  private startAlertMonitoring(): void {
    // Check alerts every 5 minutes
    interval(5 * 60 * 1000).subscribe(() => {
      this.evaluateAlerts();
    });
  }

  private evaluateAlerts(): void {
    // In production, this would check actual metrics against alert conditions
    // For now, this is a mock implementation
    console.log('Evaluating alert conditions...');
  }

  getAlerts(): Observable<Alert[]> {
    return this.alerts$;
  }

  getActiveAlerts(): Observable<Alert[]> {
    return this.alerts$.pipe(
      map(alerts => alerts.filter(a => a.enabled && a.status === AlertStatus.ACTIVE))
    );
  }

  getTriggeredAlerts(): Observable<Alert[]> {
    return this.alerts$.pipe(
      map(alerts => alerts.filter(a => a.status === AlertStatus.TRIGGERED))
    );
  }

  getAlertById(id: string): Observable<Alert | undefined> {
    return this.alerts$.pipe(
      map(alerts => alerts.find(a => a.id === id))
    );
  }

  createAlert(dto: CreateAlertDto): Observable<Alert> {
    return combineLatest([
      this.authService.getCurrentOrganization(),
      this.authService.getAuthState()
    ]).pipe(
      map(([currentOrg, authState]) => {
        const newAlert: Alert = {
          id: `alert-${Date.now()}`,
          organizationId: currentOrg.id,
          name: dto.name,
          description: dto.description,
          type: dto.type,
          severity: dto.severity,
          status: AlertStatus.ACTIVE,
          condition: dto.condition,
          actions: dto.actions,
          resourceIds: dto.resourceIds,
          triggerCount: 0,
          createdAt: new Date(),
          createdBy: authState.user?.id || 'unknown',
          enabled: dto.enabled !== undefined ? dto.enabled : true
        };

        const current = this.allAlertsSubject.value;
        this.allAlertsSubject.next([...current, newAlert]);

        return newAlert;
      }),
      delay(500)
    );
  }

  updateAlert(id: string, updates: Partial<Alert>): Observable<Alert> {
    const current = this.allAlertsSubject.value;
    const index = current.findIndex(a => a.id === id);

    if (index === -1) {
      throw new Error('Alert not found');
    }

    const updated = { ...current[index], ...updates };
    current[index] = updated;
    this.allAlertsSubject.next([...current]);

    return new Observable(observer => {
      setTimeout(() => {
        observer.next(updated);
        observer.complete();
      }, 500);
    });
  }

  deleteAlert(id: string): Observable<boolean> {
    const current = this.allAlertsSubject.value;
    const filtered = current.filter(a => a.id !== id);
    this.allAlertsSubject.next(filtered);

    return new Observable(observer => {
      setTimeout(() => {
        observer.next(true);
        observer.complete();
      }, 500);
    });
  }

  toggleAlert(id: string): Observable<Alert> {
    const current = this.allAlertsSubject.value;
    const alert = current.find(a => a.id === id);

    if (!alert) {
      throw new Error('Alert not found');
    }

    return this.updateAlert(id, { enabled: !alert.enabled });
  }

  getNotifications(): Observable<Notification[]> {
    return this.notifications$;
  }

  getUnreadNotifications(): Observable<Notification[]> {
    return this.notifications$.pipe(
      map(notifications => notifications.filter(n => !n.read))
    );
  }

  getUnreadCount(): Observable<number> {
    return this.getUnreadNotifications().pipe(
      map(notifications => notifications.length)
    );
  }

  markAsRead(notificationId: string): Observable<boolean> {
    const current = this.allNotificationsSubject.value;
    const notification = current.find(n => n.id === notificationId);

    if (notification) {
      notification.read = true;
      this.allNotificationsSubject.next([...current]);
    }

    return new Observable(observer => {
      setTimeout(() => {
        observer.next(true);
        observer.complete();
      }, 300);
    });
  }

  markAllAsRead(): Observable<boolean> {
    return combineLatest([
      this.allNotificationsSubject.asObservable(),
      this.authService.getCurrentOrganization()
    ]).pipe(
      map(([notifications, currentOrg]) => {
        const updated = notifications.map(n => {
          if (n.organizationId === currentOrg.id) {
            return { ...n, read: true };
          }
          return n;
        });
        this.allNotificationsSubject.next(updated);
        return true;
      }),
      delay(300)
    );
  }

  deleteNotification(notificationId: string): Observable<boolean> {
    const current = this.allNotificationsSubject.value;
    const filtered = current.filter(n => n.id !== notificationId);
    this.allNotificationsSubject.next(filtered);

    return new Observable(observer => {
      setTimeout(() => {
        observer.next(true);
        observer.complete();
      }, 300);
    });
  }

  getAlertHistory(alertId: string): Observable<AlertHistory[]> {
    return this.alertHistory$.pipe(
      map(history => history.filter(h => h.alertId === alertId))
    );
  }

  acknowledgeAlert(historyId: string): Observable<boolean> {
    return this.authService.getAuthState().pipe(
      map(authState => {
        const current = this.alertHistorySubject.value;
        const history = current.find(h => h.id === historyId);

        if (history) {
          history.acknowledged = true;
          history.acknowledgedBy = authState.user?.id;
          history.acknowledgedAt = new Date();
          this.alertHistorySubject.next([...current]);
        }

        return true;
      }),
      delay(300)
    );
  }
}
