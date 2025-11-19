import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { AutomationRoutingModule } from './automation-routing.module';
import { AutomationDashboardPage } from './pages/automation-dashboard/automation-dashboard.page';
import { WorkflowsPage } from './pages/workflows/workflows.page';
import { ScheduledTasksPage } from './pages/scheduled-tasks/scheduled-tasks.page';
import { AutoScalingPage } from './pages/auto-scaling/auto-scaling.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    AutomationRoutingModule
  ],
  declarations: [
    AutomationDashboardPage,
    WorkflowsPage,
    ScheduledTasksPage,
    AutoScalingPage
  ]
})
export class AutomationModule {}
