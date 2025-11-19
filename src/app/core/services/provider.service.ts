import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { ProviderConfig, ProviderConnectionStatus, ProviderStats } from '../models/provider.model';
import { CloudProvider } from '../models/resource.model';

@Injectable({
  providedIn: 'root'
})
export class ProviderService {
  private providersSubject = new BehaviorSubject<ProviderConfig[]>([]);
  public providers$ = this.providersSubject.asObservable();

  constructor() {
    this.initializeDefaultProviders();
  }

  /**
   * Initialize default provider configurations
   */
  private initializeDefaultProviders(): void {
    const defaultProviders: ProviderConfig[] = [
      {
        id: 'aws-default',
        provider: CloudProvider.AWS,
        name: 'aws',
        displayName: 'Amazon Web Services',
        status: ProviderConnectionStatus.DISCONNECTED
      },
      {
        id: 'azure-default',
        provider: CloudProvider.AZURE,
        name: 'azure',
        displayName: 'Microsoft Azure',
        status: ProviderConnectionStatus.DISCONNECTED
      },
      {
        id: 'railway-default',
        provider: CloudProvider.RAILWAY,
        name: 'railway',
        displayName: 'Railway',
        status: ProviderConnectionStatus.DISCONNECTED
      },
      {
        id: 'supabase-default',
        provider: CloudProvider.SUPABASE,
        name: 'supabase',
        displayName: 'Supabase',
        status: ProviderConnectionStatus.DISCONNECTED
      },
      {
        id: 'gcp-default',
        provider: CloudProvider.GCP,
        name: 'gcp',
        displayName: 'Google Cloud Platform',
        status: ProviderConnectionStatus.DISCONNECTED
      }
    ];
    this.providersSubject.next(defaultProviders);
  }

  /**
   * Get all providers
   */
  getAllProviders(): Observable<ProviderConfig[]> {
    return this.providers$;
  }

  /**
   * Get provider by ID
   */
  getProviderById(id: string): Observable<ProviderConfig | undefined> {
    return of(this.providersSubject.value.find(p => p.id === id));
  }

  /**
   * Get connected providers
   */
  getConnectedProviders(): Observable<ProviderConfig[]> {
    return of(
      this.providersSubject.value.filter(
        p => p.status === ProviderConnectionStatus.CONNECTED
      )
    );
  }

  /**
   * Connect to a provider
   */
  connectProvider(id: string, credentials: any): Observable<boolean> {
    const providers = this.providersSubject.value;
    const index = providers.findIndex(p => p.id === id);

    if (index !== -1) {
      providers[index] = {
        ...providers[index],
        status: ProviderConnectionStatus.CONNECTED,
        credentials,
        connectedAt: new Date(),
        lastSyncedAt: new Date()
      };
      this.providersSubject.next([...providers]);
      return of(true);
    }
    return of(false);
  }

  /**
   * Disconnect from a provider
   */
  disconnectProvider(id: string): Observable<boolean> {
    const providers = this.providersSubject.value;
    const index = providers.findIndex(p => p.id === id);

    if (index !== -1) {
      providers[index] = {
        ...providers[index],
        status: ProviderConnectionStatus.DISCONNECTED,
        credentials: undefined
      };
      this.providersSubject.next([...providers]);
      return of(true);
    }
    return of(false);
  }

  /**
   * Get provider statistics
   */
  getProviderStats(providerId: string): Observable<ProviderStats> {
    // Mock implementation - will be replaced with real data
    return of({
      totalResources: 0,
      activeResources: 0,
      totalCost: 0,
      currency: 'USD'
    });
  }

  /**
   * Test provider connection
   */
  testConnection(id: string): Observable<boolean> {
    // This will be implemented to test actual connection
    console.log(`Testing connection for provider ${id}`);
    return of(true);
  }
}
