import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { WebhookService } from '@core/services/webhook.service';
import { Webhook, WebhookEvent, CreateWebhookDto } from '@core/models/integration.model';

@Component({
  selector: 'app-webhooks',
  templateUrl: './webhooks.page.html',
  styleUrls: ['./webhooks.page.scss']
})
export class WebhooksPage implements OnInit {
  webhooks$?: Observable<Webhook[]>;
  showCreateForm = false;
  webhookForm: FormGroup;
  allEvents = Object.values(WebhookEvent);

  constructor(
    private webhookService: WebhookService,
    private formBuilder: FormBuilder,
    private alertController: AlertController
  ) {
    this.webhookForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      url: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
      events: [[], [Validators.required]]
    });
  }

  ngOnInit() {
    this.webhooks$ = this.webhookService.getWebhooks();
  }

  toggleCreateForm() {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) {
      this.webhookForm.reset();
    }
  }

  async createWebhook() {
    if (this.webhookForm.invalid) {
      const alert = await this.alertController.create({
        header: 'Invalid Form',
        message: 'Please fill in all required fields correctly.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    const dto: CreateWebhookDto = this.webhookForm.value;
    this.webhookService.createWebhook(dto).subscribe({
      next: async () => {
        const alert = await this.alertController.create({
          header: 'Webhook Created',
          message: 'Your webhook has been created successfully.',
          buttons: ['OK']
        });
        await alert.present();
        this.toggleCreateForm();
      },
      error: async () => {
        const alert = await this.alertController.create({
          header: 'Error',
          message: 'Failed to create webhook. Please try again.',
          buttons: ['OK']
        });
        await alert.present();
      }
    });
  }

  async toggleWebhook(webhook: Webhook) {
    this.webhookService.toggleWebhook(webhook.id).subscribe();
  }

  async testWebhook(webhook: Webhook, event: Event) {
    event.stopPropagation();
    const loading = await this.alertController.create({
      header: 'Testing Webhook',
      message: 'Sending test request...'
    });
    await loading.present();

    this.webhookService.testWebhook(webhook.id).subscribe({
      next: async (result) => {
        await loading.dismiss();
        const alert = await this.alertController.create({
          header: 'Test Successful',
          message: `Webhook responded with status ${result.statusCode} in ${result.responseTime}ms`,
          buttons: ['OK']
        });
        await alert.present();
      },
      error: async () => {
        await loading.dismiss();
        const alert = await this.alertController.create({
          header: 'Test Failed',
          message: 'Webhook test failed. Check your URL and try again.',
          buttons: ['OK']
        });
        await alert.present();
      }
    });
  }

  async deleteWebhook(webhook: Webhook, event: Event) {
    event.stopPropagation();
    const alert = await this.alertController.create({
      header: 'Delete Webhook',
      message: `Delete "${webhook.name}"?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Delete', role: 'destructive', handler: () => this.webhookService.deleteWebhook(webhook.id).subscribe() }
      ]
    });
    await alert.present();
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'healthy': 'success',
      'failing': 'danger',
      'disabled': 'medium'
    };
    return colors[status] || 'medium';
  }
}
