import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, delay } from 'rxjs/operators';

import {
  Webhook,
  CreateWebhookDto,
  WebhookEvent,
  WebhookStatus,
  WebhookDelivery
} from '@core/models/integration.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class WebhookService {
  private webhooksSubject = new BehaviorSubject<Webhook[]>([]);
  private allWebhooksSubject = new BehaviorSubject<Webhook[]>([]);
  private deliveriesSubject = new BehaviorSubject<WebhookDelivery[]>([]);

  webhooks$: Observable<Webhook[]>;

  constructor(private authService: AuthService) {
    // Filter webhooks by current organization
    this.webhooks$ = combineLatest([
      this.allWebhooksSubject.asObservable(),
      this.authService.getCurrentOrganization()
    ]).pipe(
      map(([webhooks, currentOrg]) => {
        if (!currentOrg) return [];
        return webhooks.filter(w => w.organizationId === currentOrg.id);
      })
    );

    this.initializeMockData();
  }

  private initializeMockData(): void {
    const mockWebhooks: Webhook[] = [
      {
        id: 'webhook-1',
        organizationId: 'org-1',
        name: 'Slack Notifications',
        description: 'Send alerts to Slack channel',
        url: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX',
        secret: 'whsec_' + Array(32).fill(0).map(() => Math.random().toString(36).charAt(2)).join(''),
        events: [WebhookEvent.ALERT_TRIGGERED, WebhookEvent.WORKFLOW_FAILED],
        enabled: true,
        status: WebhookStatus.HEALTHY,
        headers: {
          'Content-Type': 'application/json'
        },
        retryConfig: {
          maxRetries: 3,
          retryDelayMs: 1000,
          backoffMultiplier: 2,
          timeout: 5000
        },
        stats: {
          totalDeliveries: 234,
          successfulDeliveries: 230,
          failedDeliveries: 4,
          averageResponseTime: 145,
          lastSuccess: new Date(Date.now() - 30 * 60 * 1000),
          consecutiveFailures: 0
        },
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        createdBy: 'user-1',
        lastTriggered: new Date(Date.now() - 30 * 60 * 1000)
      },
      {
        id: 'webhook-2',
        organizationId: 'org-1',
        name: 'External Monitoring',
        description: 'Send events to external monitoring system',
        url: 'https://monitoring.example.com/webhooks/almonds',
        secret: 'whsec_' + Array(32).fill(0).map(() => Math.random().toString(36).charAt(2)).join(''),
        events: [WebhookEvent.RESOURCE_CREATED, WebhookEvent.RESOURCE_DELETED, WebhookEvent.SCALING_EVENT],
        enabled: true,
        status: WebhookStatus.HEALTHY,
        retryConfig: {
          maxRetries: 5,
          retryDelayMs: 2000,
          backoffMultiplier: 1.5,
          timeout: 10000
        },
        stats: {
          totalDeliveries: 1250,
          successfulDeliveries: 1248,
          failedDeliveries: 2,
          averageResponseTime: 235,
          lastSuccess: new Date(Date.now() - 1 * 60 * 60 * 1000),
          consecutiveFailures: 0
        },
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        createdBy: 'user-1',
        lastTriggered: new Date(Date.now() - 1 * 60 * 60 * 1000)
      }
    ];

    this.allWebhooksSubject.next(mockWebhooks);
  }

  getWebhooks(): Observable<Webhook[]> {
    return this.webhooks$;
  }

  getWebhookById(id: string): Observable<Webhook | undefined> {
    return this.webhooks$.pipe(
      map(webhooks => webhooks.find(w => w.id === id))
    );
  }

  createWebhook(dto: CreateWebhookDto): Observable<Webhook> {
    return combineLatest([
      this.authService.getCurrentOrganization(),
      this.authService.getAuthState()
    ]).pipe(
      map(([currentOrg, authState]) => {
        const newWebhook: Webhook = {
          id: `webhook-${Date.now()}`,
          organizationId: currentOrg.id,
          name: dto.name,
          description: dto.description,
          url: dto.url,
          secret: this.generateWebhookSecret(),
          events: dto.events,
          enabled: dto.enabled !== undefined ? dto.enabled : true,
          status: WebhookStatus.HEALTHY,
          headers: dto.headers || {},
          retryConfig: {
            maxRetries: 3,
            retryDelayMs: 1000,
            backoffMultiplier: 2,
            timeout: 5000
          },
          stats: {
            totalDeliveries: 0,
            successfulDeliveries: 0,
            failedDeliveries: 0,
            averageResponseTime: 0,
            consecutiveFailures: 0
          },
          createdAt: new Date(),
          createdBy: authState.user?.id || 'unknown'
        };

        const current = this.allWebhooksSubject.value;
        this.allWebhooksSubject.next([...current, newWebhook]);

        return newWebhook;
      }),
      delay(500)
    );
  }

  private generateWebhookSecret(): string {
    const prefix = 'whsec';
    const random = Array.from({ length: 32 }, () =>
      Math.random().toString(36).charAt(2)
    ).join('');
    return `${prefix}_${random}`;
  }

  updateWebhook(id: string, updates: Partial<Webhook>): Observable<Webhook> {
    const current = this.allWebhooksSubject.value;
    const index = current.findIndex(w => w.id === id);

    if (index === -1) {
      throw new Error('Webhook not found');
    }

    const updated = { ...current[index], ...updates };
    current[index] = updated;
    this.allWebhooksSubject.next([...current]);

    return new Observable(observer => {
      setTimeout(() => {
        observer.next(updated);
        observer.complete();
      }, 500);
    });
  }

  deleteWebhook(id: string): Observable<boolean> {
    const current = this.allWebhooksSubject.value;
    const filtered = current.filter(w => w.id !== id);
    this.allWebhooksSubject.next(filtered);

    return new Observable(observer => {
      setTimeout(() => {
        observer.next(true);
        observer.complete();
      }, 500);
    });
  }

  toggleWebhook(id: string): Observable<Webhook> {
    const current = this.allWebhooksSubject.value;
    const webhook = current.find(w => w.id === id);

    if (!webhook) {
      throw new Error('Webhook not found');
    }

    return this.updateWebhook(id, { enabled: !webhook.enabled });
  }

  testWebhook(id: string): Observable<{ success: boolean; statusCode: number; responseTime: number }> {
    return new Observable(observer => {
      setTimeout(() => {
        observer.next({
          success: true,
          statusCode: 200,
          responseTime: 145
        });
        observer.complete();
      }, 1000);
    });
  }

  getWebhookDeliveries(webhookId: string): Observable<WebhookDelivery[]> {
    return this.deliveriesSubject.pipe(
      map(deliveries => deliveries.filter(d => d.webhookId === webhookId))
    );
  }

  retryDelivery(deliveryId: string): Observable<boolean> {
    return new Observable(observer => {
      setTimeout(() => {
        observer.next(true);
        observer.complete();
      }, 1000);
    });
  }
}
