import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

import { ResourcesRoutingModule } from './resources-routing.module';
import { ResourcesListPage } from './pages/resources-list/resources-list.page';
import { ResourceDetailPage } from './pages/resource-detail/resource-detail.page';

@NgModule({
  declarations: [
    ResourcesListPage,
    ResourceDetailPage
  ],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ResourcesRoutingModule
  ]
})
export class ResourcesModule {}
