import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { AuditRoutingModule } from './audit-routing.module';
import { AuditDashboardPage } from './pages/audit-dashboard/audit-dashboard.page';
import { AuditLogsPage } from './pages/audit-logs/audit-logs.page';
import { CompliancePage } from './pages/compliance/compliance.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    AuditRoutingModule
  ],
  declarations: [
    AuditDashboardPage,
    AuditLogsPage,
    CompliancePage
  ]
})
export class AuditModule {}
