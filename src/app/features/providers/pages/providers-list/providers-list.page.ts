import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

import { ProviderService } from '@core/services/provider.service';
import { ProviderConfig, ProviderConnectionStatus } from '@core/models/provider.model';
import { CloudProvider } from '@core/models/resource.model';

@Component({
  selector: 'app-providers-list',
  templateUrl: './providers-list.page.html',
  styleUrls: ['./providers-list.page.scss']
})
export class ProvidersListPage implements OnInit {
  providers$: Observable<ProviderConfig[]>;

  providerIcons: { [key: string]: string } = {
    [CloudProvider.AWS]: 'logo-amazon',
    [CloudProvider.AZURE]: 'logo-windows',
    [CloudProvider.RAILWAY]: 'train-outline',
    [CloudProvider.SUPABASE]: 'server-outline',
    [CloudProvider.GCP]: 'logo-google',
    [CloudProvider.VERCEL]: 'triangle-outline',
    [CloudProvider.NETLIFY]: 'diamond-outline'
  };

  constructor(
    private router: Router,
    private providerService: ProviderService
  ) {
    this.providers$ = this.providerService.getAllProviders();
  }

  ngOnInit() {}

  connectProvider(provider: ProviderConfig) {
    this.router.navigate(['/providers/connect', provider.id]);
  }

  disconnectProvider(provider: ProviderConfig, event: Event) {
    event.stopPropagation();
    this.providerService.disconnectProvider(provider.id).subscribe(() => {
      console.log(`Disconnected from ${provider.displayName}`);
    });
  }

  getProviderIcon(provider: CloudProvider): string {
    return this.providerIcons[provider] || 'cloud-outline';
  }

  getStatusColor(status: ProviderConnectionStatus): string {
    switch (status) {
      case ProviderConnectionStatus.CONNECTED:
        return 'success';
      case ProviderConnectionStatus.ERROR:
        return 'danger';
      case ProviderConnectionStatus.CONFIGURING:
        return 'warning';
      default:
        return 'medium';
    }
  }

  isConnected(status: ProviderConnectionStatus): boolean {
    return status === ProviderConnectionStatus.CONNECTED;
  }
}
