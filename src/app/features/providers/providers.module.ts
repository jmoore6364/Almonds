import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ProvidersRoutingModule } from './providers-routing.module';
import { ProvidersListPage } from './pages/providers-list/providers-list.page';
import { ProviderConnectPage } from './pages/provider-connect/provider-connect.page';

@NgModule({
  declarations: [
    ProvidersListPage,
    ProviderConnectPage
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    ProvidersRoutingModule
  ]
})
export class ProvidersModule {}
