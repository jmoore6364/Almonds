import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';

import { ProviderService } from '@core/services/provider.service';
import { ProviderConfig } from '@core/models/provider.model';
import { CloudProvider } from '@core/models/resource.model';

@Component({
  selector: 'app-provider-connect',
  templateUrl: './provider-connect.page.html',
  styleUrls: ['./provider-connect.page.scss']
})
export class ProviderConnectPage implements OnInit {
  providerId: string = '';
  provider$?: Observable<ProviderConfig | undefined>;
  connectForm: FormGroup;
  isLoading = false;
  providerType: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private providerService: ProviderService
  ) {
    this.connectForm = this.formBuilder.group({});
  }

  ngOnInit() {
    this.providerId = this.route.snapshot.paramMap.get('providerId') || '';
    if (this.providerId) {
      this.provider$ = this.providerService.getProviderById(this.providerId);
      this.provider$.subscribe(provider => {
        if (provider) {
          this.providerType = provider.provider;
          this.buildForm(provider.provider);
        }
      });
    }
  }

  buildForm(provider: CloudProvider) {
    switch (provider) {
      case CloudProvider.AWS:
        this.connectForm = this.formBuilder.group({
          accessKeyId: ['', Validators.required],
          secretAccessKey: ['', Validators.required],
          region: ['us-east-1', Validators.required]
        });
        break;

      case CloudProvider.AZURE:
        this.connectForm = this.formBuilder.group({
          tenantId: ['', Validators.required],
          clientId: ['', Validators.required],
          clientSecret: ['', Validators.required]
        });
        break;

      case CloudProvider.RAILWAY:
        this.connectForm = this.formBuilder.group({
          token: ['', Validators.required],
          projectId: ['']
        });
        break;

      case CloudProvider.SUPABASE:
        this.connectForm = this.formBuilder.group({
          apiKey: ['', Validators.required],
          projectId: ['', Validators.required],
          serviceRoleKey: ['']
        });
        break;

      default:
        this.connectForm = this.formBuilder.group({
          apiKey: ['', Validators.required]
        });
    }
  }

  onSubmit() {
    if (this.connectForm.valid) {
      this.isLoading = true;

      const credentials = this.connectForm.value;

      this.providerService.connectProvider(this.providerId, credentials).subscribe({
        next: (success) => {
          this.isLoading = false;
          if (success) {
            this.router.navigate(['/providers']);
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Failed to connect provider:', error);
        }
      });
    }
  }

  testConnection() {
    this.providerService.testConnection(this.providerId).subscribe(success => {
      console.log('Connection test:', success ? 'Success' : 'Failed');
    });
  }
}
