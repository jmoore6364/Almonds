import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ResourceService } from '@core/services/resource.service';
import { ProviderService } from '@core/services/provider.service';
import { AuthService } from '@core/services/auth.service';
import { Resource, CloudProvider } from '@core/models/resource.model';
import { ProviderConfig } from '@core/models/provider.model';
import { User } from '@core/models/user.model';

interface DashboardStats {
  totalResources: number;
  activeResources: number;
  connectedProviders: number;
  totalCost: number;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss']
})
export class DashboardPage implements OnInit {
  user$: Observable<User | null>;
  resources$: Observable<Resource[]>;
  providers$: Observable<ProviderConfig[]>;
  stats$: Observable<DashboardStats>;

  providerIcons: { [key: string]: string } = {
    [CloudProvider.AWS]: 'logo-amazon',
    [CloudProvider.AZURE]: 'logo-windows',
    [CloudProvider.RAILWAY]: 'train-outline',
    [CloudProvider.SUPABASE]: 'server-outline',
    [CloudProvider.GCP]: 'logo-google'
  };

  constructor(
    private router: Router,
    private resourceService: ResourceService,
    private providerService: ProviderService,
    private authService: AuthService
  ) {
    this.user$ = this.authService.getCurrentUser();
    this.resources$ = this.resourceService.getAllResources();
    this.providers$ = this.providerService.getAllProviders();

    this.stats$ = this.resources$.pipe(
      map(resources => {
        const activeResources = resources.filter(r => r.status === 'active');
        const totalCost = resources.reduce((sum, r) => {
          return sum + (r.cost?.amount || 0);
        }, 0);

        return {
          totalResources: resources.length,
          activeResources: activeResources.length,
          connectedProviders: 0, // Will be updated from providers$
          totalCost
        };
      })
    );
  }

  ngOnInit() {
    // Load initial data
    this.loadData();
  }

  loadData() {
    this.resourceService.syncAllResources().subscribe();
  }

  navigateToResources() {
    this.router.navigate(['/resources']);
  }

  navigateToProviders() {
    this.router.navigate(['/providers']);
  }

  navigateToTraining() {
    this.router.navigate(['/training']);
  }

  getProviderIcon(provider: CloudProvider): string {
    return this.providerIcons[provider] || 'cloud-outline';
  }
}
