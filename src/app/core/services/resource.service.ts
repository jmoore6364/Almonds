import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of, combineLatest } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Resource, ResourceGroup, CloudProvider } from '../models/resource.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ResourceService {
  private allResourcesSubject = new BehaviorSubject<Resource[]>([]);
  private allResourceGroupsSubject = new BehaviorSubject<ResourceGroup[]>([]);

  // Tenant-filtered observables
  public resources$: Observable<Resource[]>;
  public resourceGroups$: Observable<ResourceGroup[]>;

  constructor(private authService: AuthService) {
    // Filter resources by current organization
    this.resources$ = combineLatest([
      this.allResourcesSubject.asObservable(),
      this.authService.getCurrentOrganization()
    ]).pipe(
      map(([resources, currentOrg]) => {
        if (!currentOrg) return [];
        return resources.filter(r => r.organizationId === currentOrg.id);
      })
    );

    // Filter resource groups by current organization
    this.resourceGroups$ = combineLatest([
      this.allResourceGroupsSubject.asObservable(),
      this.authService.getCurrentOrganization()
    ]).pipe(
      map(([groups, currentOrg]) => {
        if (!currentOrg) return [];
        return groups.filter(g => g.organizationId === currentOrg.id);
      })
    );
  }

  /**
   * Get all resources across all providers
   */
  getAllResources(): Observable<Resource[]> {
    return this.resources$;
  }

  /**
   * Get resources by provider (tenant-aware)
   */
  getResourcesByProvider(provider: CloudProvider): Observable<Resource[]> {
    return this.resources$.pipe(
      map(resources => resources.filter(r => r.provider === provider))
    );
  }

  /**
   * Get resource by ID (tenant-aware)
   */
  getResourceById(id: string): Observable<Resource | undefined> {
    return this.resources$.pipe(
      map(resources => resources.find(r => r.id === id))
    );
  }

  /**
   * Add a new resource
   */
  addResource(resource: Resource): Observable<Resource> {
    return this.authService.getCurrentOrganization().pipe(
      map(currentOrg => {
        if (!currentOrg) {
          throw new Error('No organization selected');
        }

        const newResource = {
          ...resource,
          organizationId: currentOrg.id
        };

        const current = this.allResourcesSubject.value;
        this.allResourcesSubject.next([...current, newResource]);

        return newResource;
      })
    );
  }

  /**
   * Update resource
   */
  updateResource(id: string, updates: Partial<Resource>): Observable<Resource | undefined> {
    const current = this.allResourcesSubject.value;
    const index = current.findIndex(r => r.id === id);

    if (index === -1) {
      return of(undefined);
    }

    const updated = { ...current[index], ...updates, updatedAt: new Date() };
    current[index] = updated;
    this.allResourcesSubject.next([...current]);

    return of(updated);
  }

  /**
   * Delete resource
   */
  deleteResource(id: string): Observable<boolean> {
    const current = this.allResourcesSubject.value.filter(r => r.id !== id);
    this.allResourcesSubject.next(current);
    return of(true);
  }

  /**
   * Get all resource groups
   */
  getAllResourceGroups(): Observable<ResourceGroup[]> {
    return this.resourceGroups$;
  }

  /**
   * Sync resources from all connected providers
   */
  syncAllResources(): Observable<boolean> {
    // This will be implemented to sync from all providers
    console.log('Syncing resources from all providers...');
    return of(true);
  }
}
