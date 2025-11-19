import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, delay } from 'rxjs/operators';

import {
  ApiKey,
  CreateApiKeyDto,
  ApiKeyStatus,
  ApiScope,
  ApiKeyUsage
} from '@core/models/integration.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ApiKeyService {
  private apiKeysSubject = new BehaviorSubject<ApiKey[]>([]);
  private allApiKeysSubject = new BehaviorSubject<ApiKey[]>([]);

  apiKeys$: Observable<ApiKey[]>;

  constructor(private authService: AuthService) {
    // Filter API keys by current organization
    this.apiKeys$ = combineLatest([
      this.allApiKeysSubject.asObservable(),
      this.authService.getCurrentOrganization()
    ]).pipe(
      map(([keys, currentOrg]) => {
        if (!currentOrg) return [];
        return keys.filter(k => k.organizationId === currentOrg.id);
      })
    );

    this.initializeMockData();
  }

  private initializeMockData(): void {
    const mockApiKeys: ApiKey[] = [
      {
        id: 'key-1',
        organizationId: 'org-1',
        name: 'Production API Key',
        description: 'API key for production integrations',
        key: 'alm_prod_1234567890abcdef1234567890abcdef',
        prefix: 'alm_prod_12345...',
        scopes: [ApiScope.READ_RESOURCES, ApiScope.READ_ANALYTICS],
        status: ApiKeyStatus.ACTIVE,
        rateLimit: {
          requestsPerMinute: 100,
          requestsPerHour: 5000,
          requestsPerDay: 100000,
          burstLimit: 150
        },
        usage: {
          totalRequests: 45230,
          requestsToday: 1250,
          requestsThisMonth: 38500,
          lastRequest: new Date(Date.now() - 30 * 60 * 1000),
          bandwidthUsed: 5242880,
          errorRate: 0.5
        },
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        createdBy: 'user-1',
        lastUsed: new Date(Date.now() - 30 * 60 * 1000),
        ipWhitelist: ['203.0.113.0/24']
      },
      {
        id: 'key-2',
        organizationId: 'org-1',
        name: 'CI/CD Pipeline Key',
        description: 'API key for automated deployments',
        key: 'alm_cicd_abcdef1234567890abcdef1234567890',
        prefix: 'alm_cicd_abcde...',
        scopes: [ApiScope.READ_RESOURCES, ApiScope.WRITE_RESOURCES, ApiScope.EXECUTE_WORKFLOWS],
        status: ApiKeyStatus.ACTIVE,
        rateLimit: {
          requestsPerMinute: 50,
          requestsPerHour: 2000,
          requestsPerDay: 20000
        },
        usage: {
          totalRequests: 12450,
          requestsToday: 320,
          requestsThisMonth: 8900,
          lastRequest: new Date(Date.now() - 2 * 60 * 60 * 1000),
          bandwidthUsed: 2097152,
          errorRate: 1.2
        },
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        createdBy: 'user-1',
        lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000)
      }
    ];

    this.allApiKeysSubject.next(mockApiKeys);
  }

  getApiKeys(): Observable<ApiKey[]> {
    return this.apiKeys$;
  }

  getApiKeyById(id: string): Observable<ApiKey | undefined> {
    return this.apiKeys$.pipe(
      map(keys => keys.find(k => k.id === id))
    );
  }

  createApiKey(dto: CreateApiKeyDto): Observable<{ apiKey: ApiKey; plainKey: string }> {
    return combineLatest([
      this.authService.getCurrentOrganization(),
      this.authService.getAuthState()
    ]).pipe(
      map(([currentOrg, authState]) => {
        const randomKey = this.generateApiKey();
        const prefix = randomKey.substring(0, 15) + '...';

        const newKey: ApiKey = {
          id: `key-${Date.now()}`,
          organizationId: currentOrg.id,
          name: dto.name,
          description: dto.description,
          key: randomKey,
          prefix,
          scopes: dto.scopes,
          status: ApiKeyStatus.ACTIVE,
          rateLimit: {
            requestsPerMinute: dto.rateLimit?.requestsPerMinute || 60,
            requestsPerHour: dto.rateLimit?.requestsPerHour || 3000,
            requestsPerDay: dto.rateLimit?.requestsPerDay || 50000,
            burstLimit: dto.rateLimit?.burstLimit
          },
          usage: {
            totalRequests: 0,
            requestsToday: 0,
            requestsThisMonth: 0,
            bandwidthUsed: 0,
            errorRate: 0
          },
          createdAt: new Date(),
          createdBy: authState.user?.id || 'unknown',
          expiresAt: dto.expiresAt,
          ipWhitelist: dto.ipWhitelist
        };

        const current = this.allApiKeysSubject.value;
        this.allApiKeysSubject.next([...current, newKey]);

        return { apiKey: newKey, plainKey: randomKey };
      }),
      delay(500)
    );
  }

  private generateApiKey(): string {
    const prefix = 'alm';
    const environment = 'prod';
    const random = Array.from({ length: 32 }, () =>
      Math.random().toString(36).charAt(2)
    ).join('');
    return `${prefix}_${environment}_${random}`;
  }

  revokeApiKey(id: string): Observable<boolean> {
    const current = this.allApiKeysSubject.value;
    const key = current.find(k => k.id === id);

    if (key) {
      key.status = ApiKeyStatus.REVOKED;
      this.allApiKeysSubject.next([...current]);
    }

    return new Observable(observer => {
      setTimeout(() => {
        observer.next(true);
        observer.complete();
      }, 500);
    });
  }

  deleteApiKey(id: string): Observable<boolean> {
    const current = this.allApiKeysSubject.value;
    const filtered = current.filter(k => k.id !== id);
    this.allApiKeysSubject.next(filtered);

    return new Observable(observer => {
      setTimeout(() => {
        observer.next(true);
        observer.complete();
      }, 500);
    });
  }

  updateApiKey(id: string, updates: Partial<ApiKey>): Observable<ApiKey> {
    const current = this.allApiKeysSubject.value;
    const index = current.findIndex(k => k.id === id);

    if (index === -1) {
      throw new Error('API key not found');
    }

    const updated = { ...current[index], ...updates };
    current[index] = updated;
    this.allApiKeysSubject.next([...current]);

    return new Observable(observer => {
      setTimeout(() => {
        observer.next(updated);
        observer.complete();
      }, 500);
    });
  }

  getApiKeyUsage(id: string): Observable<ApiKeyUsage> {
    return this.getApiKeyById(id).pipe(
      map(key => {
        if (!key) {
          throw new Error('API key not found');
        }
        return key.usage;
      })
    );
  }
}
