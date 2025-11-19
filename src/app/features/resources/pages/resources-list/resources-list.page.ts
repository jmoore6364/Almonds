import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ResourceService } from '@core/services/resource.service';
import { Resource, CloudProvider, ResourceType } from '@core/models/resource.model';

@Component({
  selector: 'app-resources-list',
  templateUrl: './resources-list.page.html',
  styleUrls: ['./resources-list.page.scss']
})
export class ResourcesListPage implements OnInit {
  resources$: Observable<Resource[]>;
  filteredResources$: Observable<Resource[]>;

  selectedProvider: CloudProvider | 'all' = 'all';
  selectedType: ResourceType | 'all' = 'all';
  searchTerm = '';

  providers = Object.values(CloudProvider);
  resourceTypes = Object.values(ResourceType);

  constructor(
    private router: Router,
    private resourceService: ResourceService
  ) {
    this.resources$ = this.resourceService.getAllResources();
    this.filteredResources$ = this.resources$;
  }

  ngOnInit() {
    this.applyFilters();
  }

  applyFilters() {
    this.filteredResources$ = this.resources$.pipe(
      map(resources => {
        let filtered = resources;

        // Filter by provider
        if (this.selectedProvider !== 'all') {
          filtered = filtered.filter(r => r.provider === this.selectedProvider);
        }

        // Filter by type
        if (this.selectedType !== 'all') {
          filtered = filtered.filter(r => r.type === this.selectedType);
        }

        // Filter by search term
        if (this.searchTerm) {
          const term = this.searchTerm.toLowerCase();
          filtered = filtered.filter(r =>
            r.name.toLowerCase().includes(term) ||
            r.id.toLowerCase().includes(term)
          );
        }

        return filtered;
      })
    );
  }

  onProviderChange(event: any) {
    this.selectedProvider = event.detail.value;
    this.applyFilters();
  }

  onTypeChange(event: any) {
    this.selectedType = event.detail.value;
    this.applyFilters();
  }

  onSearchChange(event: any) {
    this.searchTerm = event.detail.value || '';
    this.applyFilters();
  }

  viewResourceDetails(resource: Resource) {
    this.router.navigate(['/resources', resource.id]);
  }

  refreshResources(event?: any) {
    this.resourceService.syncAllResources().subscribe(() => {
      if (event) {
        event.target.complete();
      }
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'medium';
      case 'error':
        return 'danger';
      case 'pending':
        return 'warning';
      default:
        return 'medium';
    }
  }

  getProviderIcon(provider: CloudProvider): string {
    const icons: { [key: string]: string } = {
      [CloudProvider.AWS]: 'logo-amazon',
      [CloudProvider.AZURE]: 'logo-windows',
      [CloudProvider.RAILWAY]: 'train-outline',
      [CloudProvider.SUPABASE]: 'server-outline',
      [CloudProvider.GCP]: 'logo-google'
    };
    return icons[provider] || 'cloud-outline';
  }

  getTypeIcon(type: ResourceType): string {
    const icons: { [key: string]: string } = {
      [ResourceType.COMPUTE]: 'hardware-chip-outline',
      [ResourceType.DATABASE]: 'server-outline',
      [ResourceType.STORAGE]: 'save-outline',
      [ResourceType.NETWORK]: 'git-network-outline',
      [ResourceType.CONTAINER]: 'cube-outline',
      [ResourceType.FUNCTION]: 'flash-outline'
    };
    return icons[type] || 'apps-outline';
  }
}
