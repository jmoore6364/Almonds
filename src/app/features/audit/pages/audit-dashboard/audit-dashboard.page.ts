import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuditService } from '@core/services/audit.service';
import { AuditLog, ComplianceReport } from '@core/models/audit.model';

@Component({
  selector: 'app-audit-dashboard',
  templateUrl: './audit-dashboard.page.html',
  styleUrls: ['./audit-dashboard.page.scss']
})
export class AuditDashboardPage implements OnInit {
  recentAuditLogs$?: Observable<AuditLog[]>;
  complianceReports$?: Observable<ComplianceReport[]>;
  totalLogs$?: Observable<number>;

  constructor(
    private auditService: AuditService,
    private router: Router
  ) {}

  ngOnInit() {
    this.recentAuditLogs$ = this.auditService.getAuditLogs().pipe(map(logs => logs.slice(0, 10)));
    this.complianceReports$ = this.auditService.getComplianceReports();
    this.totalLogs$ = this.auditService.getAuditLogs().pipe(map(logs => logs.length));
  }

  viewAllLogs() {
    this.router.navigate(['/audit/logs']);
  }

  viewCompliance() {
    this.router.navigate(['/audit/compliance']);
  }
}
