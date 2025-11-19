import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { BaseProviderService } from './base-provider.service';
import { Resource, CloudProvider, ResourceStatus, ResourceType } from '../../models/resource.model';
import { ProviderConfig, ProviderCredentials } from '../../models/provider.model';

@Injectable({
  providedIn: 'root'
})
export class AzureProviderService extends BaseProviderService {

  initialize(config: ProviderConfig): Observable<boolean> {
    this.config = config;
    return of(true).pipe(delay(500));
  }

  testConnection(): Observable<boolean> {
    return of(true).pipe(delay(1000));
  }

  authenticate(credentials: ProviderCredentials): Observable<boolean> {
    console.log('Authenticating with Azure', {
      tenantId: credentials.tenantId ? '***' : undefined,
      clientId: credentials.clientId ? '***' : undefined
    });
    return of(true).pipe(delay(1000));
  }

  fetchResources(): Observable<Resource[]> {
    const mockResources: Resource[] = [
      {
        id: 'azure-vm-1',
        name: 'api-server',
        type: ResourceType.COMPUTE,
        provider: CloudProvider.AZURE,
        status: ResourceStatus.ACTIVE,
        region: 'eastus',
        metadata: {
          instance_type: 'Standard_B2s',
          size: 'medium'
        },
        tags: {
          environment: 'staging',
          team: 'backend'
        },
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date(),
        cost: {
          amount: 35.20,
          currency: 'USD',
          period: 'monthly'
        }
      },
      {
        id: 'azure-storage-1',
        name: 'media-storage',
        type: ResourceType.STORAGE,
        provider: CloudProvider.AZURE,
        status: ResourceStatus.ACTIVE,
        region: 'eastus',
        metadata: {
          size: '500GB',
          tier: 'Hot'
        },
        tags: {
          environment: 'production',
          purpose: 'media'
        },
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date(),
        cost: {
          amount: 22.50,
          currency: 'USD',
          period: 'monthly'
        }
      }
    ];

    return of(mockResources).pipe(delay(1500));
  }

  fetchResourceById(id: string): Observable<Resource | null> {
    return of(null).pipe(delay(500));
  }

  createResource(resource: Partial<Resource>): Observable<Resource> {
    const newResource: Resource = {
      id: `azure-${Date.now()}`,
      name: resource.name || 'unnamed',
      type: resource.type || ResourceType.OTHER,
      provider: CloudProvider.AZURE,
      status: ResourceStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...resource
    } as Resource;

    return of(newResource).pipe(delay(2000));
  }

  updateResource(id: string, updates: Partial<Resource>): Observable<Resource> {
    const updated = {
      id,
      ...updates,
      updatedAt: new Date()
    } as Resource;

    return of(updated).pipe(delay(1000));
  }

  deleteResource(id: string): Observable<boolean> {
    console.log(`Deleting Azure resource: ${id}`);
    return of(true).pipe(delay(1500));
  }

  getResourceMetrics(id: string): Observable<any> {
    return of({
      cpu: {
        average: 38.2,
        max: 65.1,
        min: 15.7
      },
      memory: {
        average: 55.3,
        max: 72.8,
        min: 30.2
      }
    }).pipe(delay(1000));
  }
}
