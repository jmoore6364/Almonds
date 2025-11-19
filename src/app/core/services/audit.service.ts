import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, delay } from 'rxjs/operators';

import {
  AuditLog,
  ComplianceReport,
  ComplianceControl,
  AuditAction,
  AuditStatus,
  ComplianceFramework,
  ComplianceStatus,
  AuditSearchFilter,
  DataRetentionPolicy
} from '@core/models/audit.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuditService {
  private auditLogsSubject = new BehaviorSubject<AuditLog[]>([]);
  private allAuditLogsSubject = new BehaviorSubject<AuditLog[]>([]);
  private complianceReportsSubject = new BehaviorSubject<ComplianceReport[]>([]);
  private allComplianceReportsSubject = new BehaviorSubject<ComplianceReport[]>([]);
  private complianceControlsSubject = new BehaviorSubject<ComplianceControl[]>([]);
  private retentionPoliciesSubject = new BehaviorSubject<DataRetentionPolicy[]>([]);

  auditLogs$: Observable<AuditLog[]>;
  complianceReports$: Observable<ComplianceReport[]>;

  constructor(private authService: AuthService) {
    // Filter audit logs by current organization
    this.auditLogs$ = combineLatest([
      this.allAuditLogsSubject.asObservable(),
      this.authService.getCurrentOrganization()
    ]).pipe(
      map(([logs, currentOrg]) => {
        if (!currentOrg) return [];
        return logs.filter(l => l.organizationId === currentOrg.id);
      })
    );

    // Filter compliance reports by current organization
    this.complianceReports$ = combineLatest([
      this.allComplianceReportsSubject.asObservable(),
      this.authService.getCurrentOrganization()
    ]).pipe(
      map(([reports, currentOrg]) => {
        if (!currentOrg) return [];
        return reports.filter(r => r.organizationId === currentOrg.id);
      })
    );

    this.initializeMockData();
  }

  private initializeMockData(): void {
    const mockAuditLogs: AuditLog[] = [
      {
        id: 'audit-1',
        organizationId: 'org-1',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
        userId: 'user-1',
        userName: 'John Doe',
        action: AuditAction.CREATE,
        resourceType: 'resource',
        resourceId: 'res-1',
        resourceName: 'Production Database',
        details: {
          after: { name: 'Production Database', type: 'database', provider: 'aws' }
        },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        status: AuditStatus.SUCCESS
      },
      {
        id: 'audit-2',
        organizationId: 'org-1',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        userId: 'user-2',
        userName: 'Jane Smith',
        action: AuditAction.UPDATE,
        resourceType: 'workflow',
        resourceId: 'wf-1',
        resourceName: 'Nightly Backup',
        details: {
          before: { enabled: false },
          after: { enabled: true },
          changes: { enabled: { from: false, to: true } }
        },
        ipAddress: '192.168.1.101',
        status: AuditStatus.SUCCESS
      },
      {
        id: 'audit-3',
        organizationId: 'org-1',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
        userId: 'user-1',
        userName: 'John Doe',
        action: AuditAction.LOGIN,
        resourceType: 'user',
        details: {},
        ipAddress: '192.168.1.100',
        status: AuditStatus.SUCCESS
      }
    ];

    const mockComplianceReports: ComplianceReport[] = [
      {
        id: 'report-1',
        organizationId: 'org-1',
        framework: ComplianceFramework.SOC2,
        period: {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
          label: 'Last 30 Days'
        },
        generatedAt: new Date(),
        generatedBy: 'user-1',
        status: ComplianceStatus.PARTIALLY_COMPLIANT,
        score: 82,
        findings: [
          {
            id: 'finding-1',
            control: 'CC6.1',
            requirement: 'Logical and Physical Access Controls',
            status: ComplianceStatus.COMPLIANT,
            severity: 'low',
            description: 'Access controls are properly configured',
            evidence: ['audit-logs', 'access-reviews']
          },
          {
            id: 'finding-2',
            control: 'CC7.2',
            requirement: 'System Monitoring',
            status: ComplianceStatus.NON_COMPLIANT,
            severity: 'high',
            description: 'Monitoring gaps identified in production systems',
            evidence: ['monitoring-config'],
            remediation: 'Implement comprehensive monitoring across all production resources',
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          }
        ],
        recommendations: [
          {
            id: 'rec-1',
            title: 'Implement Comprehensive Monitoring',
            description: 'Set up monitoring for all production resources',
            priority: 'high',
            effort: 'medium',
            impact: 'Improves system observability and incident response',
            steps: [
              'Enable health checks for all resources',
              'Configure alerting thresholds',
              'Set up log aggregation'
            ]
          }
        ],
        summary: {
          totalControls: 20,
          compliantControls: 15,
          nonCompliantControls: 3,
          partiallyCompliantControls: 2,
          notApplicableControls: 0,
          criticalFindings: 0,
          highFindings: 1,
          mediumFindings: 2,
          lowFindings: 5
        }
      }
    ];

    this.allAuditLogsSubject.next(mockAuditLogs);
    this.allComplianceReportsSubject.next(mockComplianceReports);
  }

  // Audit log methods
  getAuditLogs(filter?: AuditSearchFilter): Observable<AuditLog[]> {
    return this.auditLogs$.pipe(
      map(logs => {
        if (!filter) return logs;

        return logs.filter(log => {
          if (filter.startDate && log.timestamp < filter.startDate) return false;
          if (filter.endDate && log.timestamp > filter.endDate) return false;
          if (filter.userId && log.userId !== filter.userId) return false;
          if (filter.action && log.action !== filter.action) return false;
          if (filter.resourceType && log.resourceType !== filter.resourceType) return false;
          if (filter.status && log.status !== filter.status) return false;
          if (filter.searchTerm) {
            const term = filter.searchTerm.toLowerCase();
            return (
              log.userName.toLowerCase().includes(term) ||
              (log.resourceName && log.resourceName.toLowerCase().includes(term)) ||
              log.action.toLowerCase().includes(term)
            );
          }
          return true;
        });
      })
    );
  }

  logAction(action: AuditAction, resourceType: string, resourceId?: string, details?: any): void {
    this.authService.getAuthState().subscribe(authState => {
      if (!authState.user || !authState.currentOrganization) return;

      const newLog: AuditLog = {
        id: `audit-${Date.now()}`,
        organizationId: authState.currentOrganization.id,
        timestamp: new Date(),
        userId: authState.user.id,
        userName: authState.user.name,
        action,
        resourceType,
        resourceId,
        details: details || {},
        status: AuditStatus.SUCCESS
      };

      const current = this.allAuditLogsSubject.value;
      this.allAuditLogsSubject.next([newLog, ...current]);
    });
  }

  // Compliance report methods
  getComplianceReports(): Observable<ComplianceReport[]> {
    return this.complianceReports$;
  }

  getComplianceReportById(id: string): Observable<ComplianceReport | undefined> {
    return this.complianceReports$.pipe(
      map(reports => reports.find(r => r.id === id))
    );
  }

  generateComplianceReport(framework: ComplianceFramework): Observable<ComplianceReport> {
    return combineLatest([
      this.authService.getCurrentOrganization(),
      this.authService.getAuthState()
    ]).pipe(
      map(([currentOrg, authState]) => {
        const newReport: ComplianceReport = {
          id: `report-${Date.now()}`,
          organizationId: currentOrg.id,
          framework,
          period: {
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            endDate: new Date(),
            label: 'Last 30 Days'
          },
          generatedAt: new Date(),
          generatedBy: authState.user?.id || 'unknown',
          status: ComplianceStatus.IN_PROGRESS,
          score: 0,
          findings: [],
          recommendations: [],
          summary: {
            totalControls: 0,
            compliantControls: 0,
            nonCompliantControls: 0,
            partiallyCompliantControls: 0,
            notApplicableControls: 0,
            criticalFindings: 0,
            highFindings: 0,
            mediumFindings: 0,
            lowFindings: 0
          }
        };

        const current = this.allComplianceReportsSubject.value;
        this.allComplianceReportsSubject.next([newReport, ...current]);

        return newReport;
      }),
      delay(1000)
    );
  }

  exportAuditLogs(format: 'csv' | 'json' | 'pdf'): Observable<string> {
    // Mock implementation - would generate actual file in production
    return new Observable(observer => {
      setTimeout(() => {
        observer.next(`/downloads/audit-logs-${Date.now()}.${format}`);
        observer.complete();
      }, 1500);
    });
  }
}
