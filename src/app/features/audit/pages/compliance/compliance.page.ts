import { Component, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { AuditService } from '@core/services/audit.service';
import { ComplianceReport, ComplianceFramework } from '@core/models/audit.model';

@Component({
  selector: 'app-compliance',
  templateUrl: './compliance.page.html',
  styleUrls: ['./compliance.page.scss']
})
export class CompliancePage implements OnInit {
  reports$?: Observable<ComplianceReport[]>;
  frameworks = Object.values(ComplianceFramework);

  constructor(
    private auditService: AuditService,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.reports$ = this.auditService.getComplianceReports();
  }

  async generateReport() {
    const alert = await this.alertController.create({
      header: 'Generate Compliance Report',
      inputs: [
        {
          name: 'framework',
          type: 'radio',
          label: 'SOC 2',
          value: ComplianceFramework.SOC2,
          checked: true
        },
        {
          name: 'framework',
          type: 'radio',
          label: 'ISO 27001',
          value: ComplianceFramework.ISO27001
        },
        {
          name: 'framework',
          type: 'radio',
          label: 'GDPR',
          value: ComplianceFramework.GDPR
        }
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Generate',
          handler: (framework) => {
            this.auditService.generateComplianceReport(framework).subscribe();
          }
        }
      ]
    });
    await alert.present();
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'compliant': 'success',
      'non_compliant': 'danger',
      'partially_compliant': 'warning',
      'in_progress': 'primary'
    };
    return colors[status] || 'medium';
  }
}
