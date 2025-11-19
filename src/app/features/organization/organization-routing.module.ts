import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { OrganizationSettingsPage } from './pages/organization-settings/organization-settings.page';
import { TeamMembersPage } from './pages/team-members/team-members.page';
import { CreateOrganizationPage } from './pages/create-organization/create-organization.page';

const routes: Routes = [
  {
    path: 'settings',
    component: OrganizationSettingsPage
  },
  {
    path: 'team',
    component: TeamMembersPage
  },
  {
    path: 'create',
    component: CreateOrganizationPage
  },
  {
    path: '',
    redirectTo: 'settings',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OrganizationRoutingModule {}
