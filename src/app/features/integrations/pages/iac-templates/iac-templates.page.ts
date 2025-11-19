import { Component, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { IacTemplateService } from '@core/services/iac-template.service';
import { IacTemplate, IacTemplateType, DeployTemplateDto } from '@core/models/integration.model';

@Component({
  selector: 'app-iac-templates',
  templateUrl: './iac-templates.page.html',
  styleUrls: ['./iac-templates.page.scss']
})
export class IacTemplatesPage implements OnInit {
  templates$?: Observable<IacTemplate[]>;
  filterType: IacTemplateType | 'all' = 'all';
  templateTypes = Object.values(IacTemplateType);

  constructor(
    private iacTemplateService: IacTemplateService,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.loadTemplates();
  }

  loadTemplates() {
    if (this.filterType === 'all') {
      this.templates$ = this.iacTemplateService.getTemplates();
    } else {
      this.templates$ = this.iacTemplateService.getTemplatesByType(this.filterType);
    }
  }

  onFilterChange() {
    this.loadTemplates();
  }

  async viewTemplate(template: IacTemplate) {
    const alert = await this.alertController.create({
      header: template.name,
      message: `<div style="max-height: 300px; overflow-y: auto;"><pre>${template.content}</pre></div>`,
      buttons: ['Close']
    });
    await alert.present();
  }

  async deployTemplate(template: IacTemplate, event: Event) {
    event.stopPropagation();

    const inputs: any = {};
    for (const variable of template.variables) {
      if (variable.required) {
        inputs[variable.name] = variable.default || '';
      }
    }

    const alert = await this.alertController.create({
      header: `Deploy ${template.name}`,
      message: 'Enter deployment name:',
      inputs: [
        {
          name: 'deploymentName',
          type: 'text',
          placeholder: 'my-deployment',
          value: template.name.toLowerCase().replace(/\s+/g, '-')
        }
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Deploy',
          handler: (data) => {
            const dto: DeployTemplateDto = {
              templateId: template.id,
              name: data.deploymentName,
              inputs
            };
            this.iacTemplateService.deployTemplate(dto).subscribe({
              next: async () => {
                const successAlert = await this.alertController.create({
                  header: 'Deployment Started',
                  message: 'Template deployment has been initiated.',
                  buttons: ['OK']
                });
                await successAlert.present();
              }
            });
          }
        }
      ]
    });
    await alert.present();
  }

  async deleteTemplate(template: IacTemplate, event: Event) {
    event.stopPropagation();
    const alert = await this.alertController.create({
      header: 'Delete Template',
      message: `Delete "${template.name}"?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Delete', role: 'destructive', handler: () => this.iacTemplateService.deleteTemplate(template.id).subscribe() }
      ]
    });
    await alert.present();
  }

  getTypeColor(type: IacTemplateType): string {
    const colors: { [key: string]: string } = {
      'terraform': 'primary',
      'cloudformation': 'warning',
      'pulumi': 'success',
      'ansible': 'tertiary',
      'custom': 'medium'
    };
    return colors[type] || 'medium';
  }
}
