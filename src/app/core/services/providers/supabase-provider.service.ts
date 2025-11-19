import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { BaseProviderService } from './base-provider.service';
import { Resource, CloudProvider, ResourceStatus, ResourceType } from '../../models/resource.model';
import { ProviderConfig, ProviderCredentials } from '../../models/provider.model';

@Injectable({
  providedIn: 'root'
})
export class SupabaseProviderService extends BaseProviderService {

  initialize(config: ProviderConfig): Observable<boolean> {
    this.config = config;
    return of(true).pipe(delay(500));
  }

  testConnection(): Observable<boolean> {
    return of(true).pipe(delay(800));
  }

  authenticate(credentials: ProviderCredentials): Observable<boolean> {
    console.log('Authenticating with Supabase API');
    return of(true).pipe(delay(800));
  }

  fetchResources(): Observable<Resource[]> {
    const mockResources: Resource[] = [
      {
        id: 'supabase-project-1',
        name: 'mobile-app-backend',
        type: ResourceType.DATABASE,
        provider: CloudProvider.SUPABASE,
        status: ResourceStatus.ACTIVE,
        region: 'us-east-1',
        metadata: {
          url: 'https://xyzproject.supabase.co',
          database_size: '250MB',
          api_requests: 50000
        },
        tags: {
          environment: 'production',
          app: 'mobile'
        },
        createdAt: new Date('2024-01-25'),
        updatedAt: new Date(),
        cost: {
          amount: 25.00,
          currency: 'USD',
          period: 'monthly'
        }
      },
      {
        id: 'supabase-storage-1',
        name: 'user-uploads',
        type: ResourceType.STORAGE,
        provider: CloudProvider.SUPABASE,
        status: ResourceStatus.ACTIVE,
        region: 'us-east-1',
        metadata: {
          size: '5GB',
          files: 1250
        },
        tags: {
          environment: 'production',
          purpose: 'user-content'
        },
        createdAt: new Date('2024-01-25'),
        updatedAt: new Date(),
        cost: {
          amount: 0.50,
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
      id: `supabase-${Date.now()}`,
      name: resource.name || 'unnamed',
      type: resource.type || ResourceType.DATABASE,
      provider: CloudProvider.SUPABASE,
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
    console.log(`Deleting Supabase resource: ${id}`);
    return of(true).pipe(delay(1000));
  }

  getResourceMetrics(id: string): Observable<any> {
    return of({
      database: {
        size: '250MB',
        connections: 15
      },
      api: {
        requests: 50000,
        bandwidth: '2.5GB'
      },
      storage: {
        size: '5GB',
        files: 1250
      }
    }).pipe(delay(800));
  }
}
