import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertController } from '@ionic/angular';
import { Observable } from 'rxjs';

import { OrganizationService } from '@core/services/organization.service';
import { AuthService } from '@core/services/auth.service';
import { Organization, OrganizationStats } from '@core/models/organization.model';

@Component({
  selector: 'app-organization-settings',
  templateUrl: './organization-settings.page.html',
  styleUrls: ['./organization-settings.page.scss']
})
export class OrganizationSettingsPage implements OnInit {
  organization$?: Observable<Organization | null>;
  stats$?: Observable<OrganizationStats>;

  settingsForm: FormGroup;
  isSaving = false;

  constructor(
    private formBuilder: FormBuilder,
    private organizationService: OrganizationService,
    private authService: AuthService,
    private alertController: AlertController
  ) {
    this.settingsForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      website: [''],
      defaultRegion: [''],
      requireMFA: [false],
      allowPublicResources: [true],
      retentionDays: [90, [Validators.min(7), Validators.max(365)]],
      // Notifications
      resourceAlerts: [true],
      costAlerts: [true],
      securityAlerts: [true],
      weeklyReports: [false],
      emailNotifications: [true]
    });
  }

  ngOnInit() {
    this.organization$ = this.organizationService.getCurrentOrganization();

    this.organization$.subscribe(org => {
      if (org) {
        this.stats$ = this.organizationService.getOrganizationStats(org.id);

        // Populate form
        this.settingsForm.patchValue({
          name: org.name,
          description: org.description || '',
          website: org.website || '',
          defaultRegion: org.settings.defaultRegion || '',
          requireMFA: org.settings.requireMFA,
          allowPublicResources: org.settings.allowPublicResources,
          retentionDays: org.settings.retentionDays,
          resourceAlerts: org.settings.notificationPreferences.resourceAlerts,
          costAlerts: org.settings.notificationPreferences.costAlerts,
          securityAlerts: org.settings.notificationPreferences.securityAlerts,
          weeklyReports: org.settings.notificationPreferences.weeklyReports,
          emailNotifications: org.settings.notificationPreferences.email
        });
      }
    });
  }

  async saveSettings() {
    if (this.settingsForm.valid) {
      this.isSaving = true;

      const org = await this.organization$?.toPromise();
      if (!org) return;

      const formValue = this.settingsForm.value;

      const updateDto = {
        name: formValue.name,
        description: formValue.description,
        website: formValue.website,
        settings: {
          defaultRegion: formValue.defaultRegion,
          requireMFA: formValue.requireMFA,
          allowPublicResources: formValue.allowPublicResources,
          retentionDays: formValue.retentionDays,
          notificationPreferences: {
            ...org.settings.notificationPreferences,
            resourceAlerts: formValue.resourceAlerts,
            costAlerts: formValue.costAlerts,
            securityAlerts: formValue.securityAlerts,
            weeklyReports: formValue.weeklyReports,
            email: formValue.emailNotifications
          }
        }
      };

      this.organizationService.updateOrganization(org.id, updateDto).subscribe({
        next: async () => {
          this.isSaving = false;
          const alert = await this.alertController.create({
            header: 'Success',
            message: 'Organization settings updated successfully',
            buttons: ['OK']
          });
          await alert.present();
        },
        error: async (error) => {
          this.isSaving = false;
          const alert = await this.alertController.create({
            header: 'Error',
            message: error.message || 'Failed to update settings',
            buttons: ['OK']
          });
          await alert.present();
        }
      });
    }
  }

  async deleteOrganization() {
    const org = await this.organization$?.toPromise();
    if (!org) return;

    const confirmAlert = await this.alertController.create({
      header: 'Delete Organization',
      message: `Are you sure you want to delete "${org.name}"? This action cannot be undone. All resources and data will be permanently deleted.`,
      inputs: [
        {
          name: 'confirmation',
          type: 'text',
          placeholder: 'Type organization name to confirm'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: (data) => {
            if (data.confirmation === org.name) {
              this.organizationService.deleteOrganization(org.id).subscribe({
                next: () => {
                  // Redirect to dashboard or organization selection
                  window.location.href = '/dashboard';
                }
              });
              return true;
            } else {
              this.alertController.create({
                header: 'Error',
                message: 'Organization name does not match',
                buttons: ['OK']
              }).then(alert => alert.present());
              return false;
            }
          }
        }
      ]
    });

    await confirmAlert.present();
  }
}
