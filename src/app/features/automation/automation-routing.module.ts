import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AutomationDashboardPage } from './pages/automation-dashboard/automation-dashboard.page';
import { WorkflowsPage } from './pages/workflows/workflows.page';
import { ScheduledTasksPage } from './pages/scheduled-tasks/scheduled-tasks.page';
import { AutoScalingPage } from './pages/auto-scaling/auto-scaling.page';

const routes: Routes = [
  {
    path: '',
    component: AutomationDashboardPage
  },
  {
    path: 'workflows',
    component: WorkflowsPage
  },
  {
    path: 'scheduled-tasks',
    component: ScheduledTasksPage
  },
  {
    path: 'auto-scaling',
    component: AutoScalingPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AutomationRoutingModule {}
