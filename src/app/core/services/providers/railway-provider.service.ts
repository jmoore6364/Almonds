import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { BaseProviderService } from './base-provider.service';
import { Resource, CloudProvider, ResourceStatus, ResourceType } from '../../models/resource.model';
import { ProviderConfig, ProviderCredentials } from '../../models/provider.model';

@Injectable({
  providedIn: 'root'
})
export class RailwayProviderService extends BaseProviderService {

  initialize(config: ProviderConfig): Observable<boolean> {
    this.config = config;
    return of(true).pipe(delay(500));
  }

  testConnection(): Observable<boolean> {
    return of(true).pipe(delay(800));
  }

  authenticate(credentials: ProviderCredentials): Observable<boolean> {
    console.log('Authenticating with Railway API');
    return of(true).pipe(delay(800));
  }

  fetchResources(): Observable<Resource[]> {
    const mockResources: Resource[] = [
      {
        id: 'railway-app-1',
        name: 'nextjs-frontend',
        type: ResourceType.CONTAINER,
        provider: CloudProvider.RAILWAY,
        status: ResourceStatus.ACTIVE,
        region: 'us-west1',
        metadata: {
          url: 'https://nextjs-frontend.railway.app',
          framework: 'Next.js'
        },
        tags: {
          environment: 'production',
          framework: 'nextjs'
        },
        createdAt: new Date('2024-02-15'),
        updatedAt: new Date(),
        cost: {
          amount: 5.00,
          currency: 'USD',
          period: 'monthly'
        }
      },
      {
        id: 'railway-db-1',
        name: 'postgres-dev',
        type: ResourceType.DATABASE,
        provider: CloudProvider.RAILWAY,
        status: ResourceStatus.ACTIVE,
        region: 'us-west1',
        metadata: {
          connection_string: 'postgresql://***',
          size: '1GB'
        },
        tags: {
          environment: 'development',
          database: 'postgresql'
        },
        createdAt: new Date('2024-02-10'),
        updatedAt: new Date(),
        cost: {
          amount: 3.00,
          currency: 'USD',
          period: 'monthly'
        }
      }
    ];

    return of(mockResources).pipe(delay(1000));
  }

  fetchResourceById(id: string): Observable<Resource | null> {
    return of(null).pipe(delay(500));
  }

  createResource(resource: Partial<Resource>): Observable<Resource> {
    const newResource: Resource = {
      id: `railway-${Date.now()}`,
      name: resource.name || 'unnamed',
      type: resource.type || ResourceType.CONTAINER,
      provider: CloudProvider.RAILWAY,
      status: ResourceStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...resource
    } as Resource;

    return of(newResource).pipe(delay(1500));
  }

  updateResource(id: string, updates: Partial<Resource>): Observable<Resource> {
    const updated = {
      id,
      ...updates,
      updatedAt: new Date()
    } as Resource;

    return of(updated).pipe(delay(800));
  }

  deleteResource(id: string): Observable<boolean> {
    console.log(`Deleting Railway resource: ${id}`);
    return of(true).pipe(delay(1000));
  }

  getResourceMetrics(id: string): Observable<any> {
    return of({
      deployments: 15,
      uptime: 99.9,
      requests: {
        total: 125000,
        errors: 23
      }
    }).pipe(delay(800));
  }
}
