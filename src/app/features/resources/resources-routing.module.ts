import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ResourcesListPage } from './pages/resources-list/resources-list.page';
import { ResourceDetailPage } from './pages/resource-detail/resource-detail.page';

const routes: Routes = [
  {
    path: '',
    component: ResourcesListPage
  },
  {
    path: ':id',
    component: ResourceDetailPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ResourcesRoutingModule {}
