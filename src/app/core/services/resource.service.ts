import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { Resource, ResourceGroup, CloudProvider } from '../models/resource.model';

@Injectable({
  providedIn: 'root'
})
export class ResourceService {
  private resourcesSubject = new BehaviorSubject<Resource[]>([]);
  public resources$ = this.resourcesSubject.asObservable();

  private resourceGroupsSubject = new BehaviorSubject<ResourceGroup[]>([]);
  public resourceGroups$ = this.resourceGroupsSubject.asObservable();

  constructor() {}

  /**
   * Get all resources across all providers
   */
  getAllResources(): Observable<Resource[]> {
    return this.resources$;
  }

  /**
   * Get resources by provider
   */
  getResourcesByProvider(provider: CloudProvider): Observable<Resource[]> {
    return of(this.resourcesSubject.value.filter(r => r.provider === provider));
  }

  /**
   * Get resource by ID
   */
  getResourceById(id: string): Observable<Resource | undefined> {
    return of(this.resourcesSubject.value.find(r => r.id === id));
  }

  /**
   * Add a new resource
   */
  addResource(resource: Resource): void {
    const current = this.resourcesSubject.value;
    this.resourcesSubject.next([...current, resource]);
  }

  /**
   * Update resource
   */
  updateResource(id: string, updates: Partial<Resource>): void {
    const current = this.resourcesSubject.value;
    const index = current.findIndex(r => r.id === id);
    if (index !== -1) {
      current[index] = { ...current[index], ...updates, updatedAt: new Date() };
      this.resourcesSubject.next([...current]);
    }
  }

  /**
   * Delete resource
   */
  deleteResource(id: string): void {
    const current = this.resourcesSubject.value.filter(r => r.id !== id);
    this.resourcesSubject.next(current);
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
