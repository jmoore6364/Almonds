import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { ApiKeyService } from '@core/services/api-key.service';
import { ApiKey, ApiScope, CreateApiKeyDto } from '@core/models/integration.model';

@Component({
  selector: 'app-api-keys',
  templateUrl: './api-keys.page.html',
  styleUrls: ['./api-keys.page.scss']
})
export class ApiKeysPage implements OnInit {
  apiKeys$?: Observable<ApiKey[]>;
  showCreateForm = false;
  apiKeyForm: FormGroup;
  allScopes = Object.values(ApiScope);
  newApiKeyPlainText?: string;

  constructor(
    private apiKeyService: ApiKeyService,
    private formBuilder: FormBuilder,
    private alertController: AlertController
  ) {
    this.apiKeyForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      scopes: [[], [Validators.required]],
      requestsPerMinute: [60, [Validators.required, Validators.min(1)]],
      expiresInDays: [null]
    });
  }

  ngOnInit() {
    this.apiKeys$ = this.apiKeyService.getApiKeys();
  }

  toggleCreateForm() {
    this.showCreateForm = !this.showCreateForm;
    this.newApiKeyPlainText = undefined;
    if (!this.showCreateForm) {
      this.apiKeyForm.reset({ requestsPerMinute: 60 });
    }
  }

  async createApiKey() {
    if (this.apiKeyForm.invalid) {
      const alert = await this.alertController.create({
        header: 'Invalid Form',
        message: 'Please fill in all required fields.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    const formValue = this.apiKeyForm.value;
    const dto: CreateApiKeyDto = {
      name: formValue.name,
      description: formValue.description,
      scopes: formValue.scopes,
      expiresAt: formValue.expiresInDays ? new Date(Date.now() + formValue.expiresInDays * 24 * 60 * 60 * 1000) : undefined,
      rateLimit: {
        requestsPerMinute: formValue.requestsPerMinute,
        requestsPerHour: formValue.requestsPerMinute * 60,
        requestsPerDay: formValue.requestsPerMinute * 60 * 24
      }
    };

    this.apiKeyService.createApiKey(dto).subscribe({
      next: async (result) => {
        this.newApiKeyPlainText = result.plainKey;
        const alert = await this.alertController.create({
          header: 'API Key Created',
          message: 'Your API key has been created. Make sure to copy it now as it won\'t be shown again!',
          buttons: ['OK']
        });
        await alert.present();
      },
      error: async () => {
        const alert = await this.alertController.create({
          header: 'Error',
          message: 'Failed to create API key. Please try again.',
          buttons: ['OK']
        });
        await alert.present();
      }
    });
  }

  copyApiKey() {
    if (this.newApiKeyPlainText) {
      navigator.clipboard.writeText(this.newApiKeyPlainText);
    }
  }

  async revokeApiKey(apiKey: ApiKey, event: Event) {
    event.stopPropagation();
    const alert = await this.alertController.create({
      header: 'Revoke API Key',
      message: `Revoke "${apiKey.name}"? This action cannot be undone.`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Revoke', role: 'destructive', handler: () => this.apiKeyService.revokeApiKey(apiKey.id).subscribe() }
      ]
    });
    await alert.present();
  }

  async deleteApiKey(apiKey: ApiKey, event: Event) {
    event.stopPropagation();
    const alert = await this.alertController.create({
      header: 'Delete API Key',
      message: `Delete "${apiKey.name}"?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Delete', role: 'destructive', handler: () => this.apiKeyService.deleteApiKey(apiKey.id).subscribe() }
      ]
    });
    await alert.present();
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'active': 'success',
      'revoked': 'danger',
      'expired': 'medium',
      'suspended': 'warning'
    };
    return colors[status] || 'medium';
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}
