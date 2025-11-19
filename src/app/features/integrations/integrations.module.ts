import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { IntegrationsRoutingModule } from './integrations-routing.module';
import { IntegrationsDashboardPage } from './pages/integrations-dashboard/integrations-dashboard.page';
import { ApiKeysPage } from './pages/api-keys/api-keys.page';
import { WebhooksPage } from './pages/webhooks/webhooks.page';
import { IacTemplatesPage } from './pages/iac-templates/iac-templates.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    IntegrationsRoutingModule
  ],
  declarations: [
    IntegrationsDashboardPage,
    ApiKeysPage,
    WebhooksPage,
    IacTemplatesPage
  ]
})
export class IntegrationsModule {}
