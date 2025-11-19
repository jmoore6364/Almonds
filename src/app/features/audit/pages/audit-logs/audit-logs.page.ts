import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { AuditService } from '@core/services/audit.service';
import { AuditLog, AuditAction } from '@core/models/audit.model';

@Component({
  selector: 'app-audit-logs',
  templateUrl: './audit-logs.page.html',
  styleUrls: ['./audit-logs.page.scss']
})
export class AuditLogsPage implements OnInit {
  auditLogs$?: Observable<AuditLog[]>;

  constructor(private auditService: AuditService) {}

  ngOnInit() {
    this.auditLogs$ = this.auditService.getAuditLogs();
  }

  async exportLogs(format: 'csv' | 'json' | 'pdf') {
    this.auditService.exportAuditLogs(format).subscribe();
  }
}
