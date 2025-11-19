import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of, combineLatest } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { ProviderConfig, ProviderConnectionStatus, ProviderStats } from '../models/provider.model';
import { CloudProvider } from '../models/resource.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ProviderService {
  private allProvidersSubject = new BehaviorSubject<ProviderConfig[]>([]);

  // Tenant-filtered observable
  public providers$: Observable<ProviderConfig[]>;

  constructor(private authService: AuthService) {
    this.initializeDefaultProviders();

    // Filter providers by current organization
    this.providers$ = combineLatest([
      this.allProvidersSubject.asObservable(),
      this.authService.getCurrentOrganization()
    ]).pipe(
      map(([providers, currentOrg]) => {
        if (!currentOrg) return [];
        return providers.filter(p => p.organizationId === currentOrg.id);
      })
    );
  }

  /**
   * Initialize default provider configurations for the current organization
   */
  private initializeDefaultProviders(): void {
    // Subscribe to organization changes to create default providers
    this.authService.getCurrentOrganization().pipe(take(1)).subscribe(currentOrg => {
      if (!currentOrg) return;

      const defaultProviders: ProviderConfig[] = [
        {
          id: `${currentOrg.id}-aws-default`,
          organizationId: currentOrg.id,
          provider: CloudProvider.AWS,
          name: 'aws',
          displayName: 'Amazon Web Services',
          status: ProviderConnectionStatus.DISCONNECTED
        },
        {
          id: `${currentOrg.id}-azure-default`,
          organizationId: currentOrg.id,
          provider: CloudProvider.AZURE,
          name: 'azure',
          displayName: 'Microsoft Azure',
          status: ProviderConnectionStatus.DISCONNECTED
        },
        {
          id: `${currentOrg.id}-railway-default`,
          organizationId: currentOrg.id,
          provider: CloudProvider.RAILWAY,
          name: 'railway',
          displayName: 'Railway',
          status: ProviderConnectionStatus.DISCONNECTED
        },
        {
          id: `${currentOrg.id}-supabase-default`,
          organizationId: currentOrg.id,
          provider: CloudProvider.SUPABASE,
          name: 'supabase',
          displayName: 'Supabase',
          status: ProviderConnectionStatus.DISCONNECTED
        },
        {
          id: `${currentOrg.id}-gcp-default`,
          organizationId: currentOrg.id,
          provider: CloudProvider.GCP,
          name: 'gcp',
          displayName: 'Google Cloud Platform',
          status: ProviderConnectionStatus.DISCONNECTED
        }
      ];
      this.allProvidersSubject.next(defaultProviders);
    });
  }

  /**
   * Get all providers
   */
  getAllProviders(): Observable<ProviderConfig[]> {
    return this.providers$;
  }

  /**
   * Get provider by ID (tenant-aware)
   */
  getProviderById(id: string): Observable<ProviderConfig | undefined> {
    return this.providers$.pipe(
      map(providers => providers.find(p => p.id === id))
    );
  }

  /**
   * Get connected providers (tenant-aware)
   */
  getConnectedProviders(): Observable<ProviderConfig[]> {
    return this.providers$.pipe(
      map(providers => providers.filter(
        p => p.status === ProviderConnectionStatus.CONNECTED
      ))
    );
  }

  /**
   * Connect to a provider
   */
  connectProvider(id: string, credentials: any): Observable<boolean> {
    const providers = this.allProvidersSubject.value;
    const index = providers.findIndex(p => p.id === id);

    if (index !== -1) {
      providers[index] = {
        ...providers[index],
        status: ProviderConnectionStatus.CONNECTED,
        credentials,
        connectedAt: new Date(),
        lastSyncedAt: new Date()
      };
      this.allProvidersSubject.next([...providers]);
      return of(true);
    }
    return of(false);
  }

  /**
   * Disconnect from a provider
   */
  disconnectProvider(id: string): Observable<boolean> {
    const providers = this.allProvidersSubject.value;
    const index = providers.findIndex(p => p.id === id);

    if (index !== -1) {
      providers[index] = {
        ...providers[index],
        status: ProviderConnectionStatus.DISCONNECTED,
        credentials: undefined
      };
      this.allProvidersSubject.next([...providers]);
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
