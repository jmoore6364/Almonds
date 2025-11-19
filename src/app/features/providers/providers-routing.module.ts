import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ProvidersListPage } from './pages/providers-list/providers-list.page';
import { ProviderConnectPage } from './pages/provider-connect/provider-connect.page';

const routes: Routes = [
  {
    path: '',
    component: ProvidersListPage
  },
  {
    path: 'connect/:providerId',
    component: ProviderConnectPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProvidersRoutingModule {}
