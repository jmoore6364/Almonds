import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuditDashboardPage } from './pages/audit-dashboard/audit-dashboard.page';
import { AuditLogsPage } from './pages/audit-logs/audit-logs.page';
import { CompliancePage } from './pages/compliance/compliance.page';

const routes: Routes = [
  {
    path: '',
    component: AuditDashboardPage
  },
  {
    path: 'logs',
    component: AuditLogsPage
  },
  {
    path: 'compliance',
    component: CompliancePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuditRoutingModule {}
