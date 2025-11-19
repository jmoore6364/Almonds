import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { IntegrationsDashboardPage } from './pages/integrations-dashboard/integrations-dashboard.page';
import { ApiKeysPage } from './pages/api-keys/api-keys.page';
import { WebhooksPage } from './pages/webhooks/webhooks.page';
import { IacTemplatesPage } from './pages/iac-templates/iac-templates.page';

const routes: Routes = [
  {
    path: '',
    component: IntegrationsDashboardPage
  },
  {
    path: 'api-keys',
    component: ApiKeysPage
  },
  {
    path: 'webhooks',
    component: WebhooksPage
  },
  {
    path: 'iac-templates',
    component: IacTemplatesPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class IntegrationsRoutingModule {}
