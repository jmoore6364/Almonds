import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiKeyService } from '@core/services/api-key.service';
import { WebhookService } from '@core/services/webhook.service';
import { IacTemplateService } from '@core/services/iac-template.service';

@Component({
  selector: 'app-integrations-dashboard',
  templateUrl: './integrations-dashboard.page.html',
  styleUrls: ['./integrations-dashboard.page.scss']
})
export class IntegrationsDashboardPage implements OnInit {
  apiKeysCount$?: Observable<number>;
  webhooksCount$?: Observable<number>;
  templatesCount$?: Observable<number>;
  deploymentsCount$?: Observable<number>;

  constructor(
    private apiKeyService: ApiKeyService,
    private webhookService: WebhookService,
    private iacTemplateService: IacTemplateService,
    private router: Router
  ) {}

  ngOnInit() {
    this.apiKeysCount$ = this.apiKeyService.getApiKeys().pipe(map(keys => keys.length));
    this.webhooksCount$ = this.webhookService.getWebhooks().pipe(map(webhooks => webhooks.length));
    this.templatesCount$ = this.iacTemplateService.getTemplates().pipe(map(templates => templates.length));
    this.deploymentsCount$ = this.iacTemplateService.getDeployments().pipe(map(deployments => deployments.length));
  }

  viewApiKeys() {
    this.router.navigate(['/integrations/api-keys']);
  }

  viewWebhooks() {
    this.router.navigate(['/integrations/webhooks']);
  }

  viewIacTemplates() {
    this.router.navigate(['/integrations/iac-templates']);
  }
}
