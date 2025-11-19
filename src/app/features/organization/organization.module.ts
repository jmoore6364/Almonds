import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { OrganizationRoutingModule } from './organization-routing.module';
import { OrganizationSettingsPage } from './pages/organization-settings/organization-settings.page';
import { TeamMembersPage } from './pages/team-members/team-members.page';
import { OrganizationSwitcherComponent } from './components/organization-switcher/organization-switcher.component';
import { CreateOrganizationPage } from './pages/create-organization/create-organization.page';

@NgModule({
  declarations: [
    OrganizationSettingsPage,
    TeamMembersPage,
    CreateOrganizationPage,
    OrganizationSwitcherComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    OrganizationRoutingModule
  ],
  exports: [
    OrganizationSwitcherComponent
  ]
})
export class OrganizationModule {}
