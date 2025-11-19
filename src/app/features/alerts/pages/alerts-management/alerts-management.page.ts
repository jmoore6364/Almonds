import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertController, ModalController } from '@ionic/angular';
import { Observable } from 'rxjs';

import { AlertService } from '@core/services/alert.service';
import { Alert, AlertType, AlertSeverity, AlertStatus, ConditionOperator, CreateAlertDto } from '@core/models/alert.model';

@Component({
  selector: 'app-alerts-management',
  templateUrl: './alerts-management.page.html',
  styleUrls: ['./alerts-management.page.scss']
})
export class AlertsManagementPage implements OnInit {
  alerts$?: Observable<Alert[]>;
  showCreateForm = false;
  alertForm: FormGroup;
  alertTypes = Object.values(AlertType);
  alertSeverities = Object.values(AlertSeverity);
  conditionOperators = Object.values(ConditionOperator);

  constructor(
    private alertService: AlertService,
    private formBuilder: FormBuilder,
    private alertController: AlertController,
    private modalController: ModalController
  ) {
    this.alertForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required]],
      type: [AlertType.COST, [Validators.required]],
      severity: [AlertSeverity.WARNING, [Validators.required]],
      metric: ['', [Validators.required]],
      operator: [ConditionOperator.GREATER_THAN, [Validators.required]],
      threshold: [0, [Validators.required, Validators.min(0)]],
      timeWindow: [15],
      emailEnabled: [true],
      emailTarget: ['', [Validators.email]],
      inAppEnabled: [true]
    });
  }

  ngOnInit() {
    this.alerts$ = this.alertService.getAlerts();
  }

  getSeverityColor(severity: AlertSeverity): string {
    const colors: { [key: string]: string } = {
      'info': 'primary',
      'warning': 'warning',
      'critical': 'danger',
      'emergency': 'danger'
    };
    return colors[severity] || 'medium';
  }

  getStatusColor(status: AlertStatus): string {
    const colors: { [key: string]: string } = {
      'active': 'success',
      'triggered': 'warning',
      'resolved': 'medium',
      'disabled': 'medium',
      'snoozed': 'medium'
    };
    return colors[status] || 'medium';
  }

  toggleCreateForm() {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) {
      this.alertForm.reset({
        type: AlertType.COST,
        severity: AlertSeverity.WARNING,
        operator: ConditionOperator.GREATER_THAN,
        threshold: 0,
        timeWindow: 15,
        emailEnabled: true,
        inAppEnabled: true
      });
    }
  }

  async createAlert() {
    if (this.alertForm.invalid) {
      const alert = await this.alertController.create({
        header: 'Invalid Form',
        message: 'Please fill in all required fields correctly.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    const formValue = this.alertForm.value;
    const actions = [];

    if (formValue.emailEnabled && formValue.emailTarget) {
      actions.push({
        type: 'email',
        target: formValue.emailTarget,
        enabled: true
      });
    }

    if (formValue.inAppEnabled) {
      actions.push({
        type: 'in_app',
        target: 'all',
        enabled: true
      });
    }

    const dto: CreateAlertDto = {
      name: formValue.name,
      description: formValue.description,
      type: formValue.type,
      severity: formValue.severity,
      condition: {
        metric: formValue.metric,
        operator: formValue.operator,
        threshold: formValue.threshold,
        timeWindow: formValue.timeWindow,
        aggregation: 'avg'
      },
      actions,
      enabled: true
    };

    this.alertService.createAlert(dto).subscribe({
      next: async () => {
        const alert = await this.alertController.create({
          header: 'Alert Created',
          message: 'Your alert has been created successfully.',
          buttons: ['OK']
        });
        await alert.present();
        this.toggleCreateForm();
      },
      error: async (error) => {
        const alert = await this.alertController.create({
          header: 'Error',
          message: 'Failed to create alert. Please try again.',
          buttons: ['OK']
        });
        await alert.present();
      }
    });
  }

  async toggleAlert(alert: Alert) {
    this.alertService.toggleAlert(alert.id).subscribe();
  }

  async deleteAlert(alert: Alert, event: Event) {
    event.stopPropagation();

    const alert_ = await this.alertController.create({
      header: 'Delete Alert',
      message: `Are you sure you want to delete "${alert.name}"?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.alertService.deleteAlert(alert.id).subscribe();
          }
        }
      ]
    });

    await alert_.present();
  }
}
