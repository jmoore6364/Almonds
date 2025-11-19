import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

import { AlertService } from '@core/services/alert.service';
import { Notification, AlertSeverity, NotificationType } from '@core/models/alert.model';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.scss']
})
export class NotificationsPage implements OnInit {
  notifications$?: Observable<Notification[]>;
  unreadCount$?: Observable<number>;
  filter: 'all' | 'unread' = 'all';

  constructor(
    private alertService: AlertService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadNotifications();
  }

  loadNotifications() {
    if (this.filter === 'all') {
      this.notifications$ = this.alertService.getNotifications();
    } else {
      this.notifications$ = this.alertService.getUnreadNotifications();
    }
    this.unreadCount$ = this.alertService.getUnreadCount();
  }

  setFilter(filter: 'all' | 'unread') {
    this.filter = filter;
    this.loadNotifications();
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

  getNotificationIcon(type: NotificationType): string {
    const icons: { [key: string]: string } = {
      'alert': 'notifications-outline',
      'system': 'information-circle-outline',
      'resource_update': 'server-outline',
      'cost_alert': 'cash-outline',
      'security': 'shield-outline',
      'team': 'people-outline',
      'billing': 'card-outline'
    };
    return icons[type] || 'mail-outline';
  }

  async markAsRead(notification: Notification) {
    await this.alertService.markAsRead(notification.id).toPromise();
    if (notification.actionUrl) {
      this.router.navigateByUrl(notification.actionUrl);
    }
  }

  async markAllAsRead() {
    await this.alertService.markAllAsRead().toPromise();
  }

  async deleteNotification(notification: Notification, event: Event) {
    event.stopPropagation();
    await this.alertService.deleteNotification(notification.id).toPromise();
  }

  getRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(date).toLocaleDateString();
  }
}
