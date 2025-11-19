import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertController } from '@ionic/angular';
import { Observable } from 'rxjs';

import { MonitoringService } from '@core/services/monitoring.service';
import { ResourceService } from '@core/services/resource.service';
import {
  HealthCheck,
  MonitoringDashboard,
  HealthCheckType,
  HealthStatus,
  CreateHealthCheckDto,
  TimePeriod,
  UptimeMetrics
} from '@core/models/monitoring.model';
import { Resource } from '@core/models/resource.model';

@Component({
  selector: 'app-health-monitoring',
  templateUrl: './health-monitoring.page.html',
  styleUrls: ['./health-monitoring.page.scss']
})
export class HealthMonitoringPage implements OnInit {
  dashboard$?: Observable<MonitoringDashboard>;
  healthChecks$?: Observable<HealthCheck[]>;
  resources$?: Observable<Resource[]>;
  showCreateForm = false;
  healthCheckForm: FormGroup;
  healthCheckTypes = Object.values(HealthCheckType);
  selectedPeriod: TimePeriod = TimePeriod.WEEK;
  timePeriods = Object.values(TimePeriod).filter(p => p !== TimePeriod.CUSTOM);

  constructor(
    private monitoringService: MonitoringService,
    private resourceService: ResourceService,
    private formBuilder: FormBuilder,
    private alertController: AlertController
  ) {
    this.healthCheckForm = this.formBuilder.group({
      resourceId: ['', [Validators.required]],
      name: ['', [Validators.required, Validators.minLength(3)]],
      type: [HealthCheckType.HTTPS, [Validators.required]],
      endpoint: [''],
      interval: [5, [Validators.required, Validators.min(1)]],
      timeout: [10, [Validators.required, Validators.min(1)]],
      enabled: [true]
    });
  }

  ngOnInit() {
    this.loadDashboard();
    this.healthChecks$ = this.monitoringService.getHealthChecks();
    this.resources$ = this.resourceService.getAllResources();
  }

  loadDashboard() {
    this.dashboard$ = this.monitoringService.getMonitoringDashboard();
  }

  getHealthStatusColor(status: HealthStatus): string {
    const colors: { [key: string]: string } = {
      'healthy': 'success',
      'degraded': 'warning',
      'unhealthy': 'danger',
      'unknown': 'medium',
      'checking': 'primary'
    };
    return colors[status] || 'medium';
  }

  getHealthStatusIcon(status: HealthStatus): string {
    const icons: { [key: string]: string } = {
      'healthy': 'checkmark-circle',
      'degraded': 'warning',
      'unhealthy': 'close-circle',
      'unknown': 'help-circle',
      'checking': 'sync'
    };
    return icons[status] || 'help-circle';
  }

  toggleCreateForm() {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) {
      this.healthCheckForm.reset({
        type: HealthCheckType.HTTPS,
        interval: 5,
        timeout: 10,
        enabled: true
      });
    }
  }

  async createHealthCheck() {
    if (this.healthCheckForm.invalid) {
      const alert = await this.alertController.create({
        header: 'Invalid Form',
        message: 'Please fill in all required fields correctly.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    const dto: CreateHealthCheckDto = this.healthCheckForm.value;

    this.monitoringService.createHealthCheck(dto).subscribe({
      next: async () => {
        const alert = await this.alertController.create({
          header: 'Health Check Created',
          message: 'Your health check has been created successfully.',
          buttons: ['OK']
        });
        await alert.present();
        this.toggleCreateForm();
      },
      error: async (error) => {
        const alert = await this.alertController.create({
          header: 'Error',
          message: 'Failed to create health check. Please try again.',
          buttons: ['OK']
        });
        await alert.present();
      }
    });
  }

  async toggleHealthCheck(healthCheck: HealthCheck) {
    this.monitoringService.toggleHealthCheck(healthCheck.id).subscribe();
  }

  async deleteHealthCheck(healthCheck: HealthCheck, event: Event) {
    event.stopPropagation();

    const alert = await this.alertController.create({
      header: 'Delete Health Check',
      message: `Are you sure you want to delete "${healthCheck.name}"?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.monitoringService.deleteHealthCheck(healthCheck.id).subscribe();
          }
        }
      ]
    });

    await alert.present();
  }

  getResourceName(resourceId: string, resources: Resource[]): string {
    const resource = resources.find(r => r.id === resourceId);
    return resource ? resource.name : 'Unknown Resource';
  }
}
