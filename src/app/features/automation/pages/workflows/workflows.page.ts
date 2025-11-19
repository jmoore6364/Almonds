import { Component, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { AutomationService } from '@core/services/automation.service';
import { Workflow } from '@core/models/automation.model';

@Component({
  selector: 'app-workflows',
  templateUrl: './workflows.page.html',
  styleUrls: ['./workflows.page.scss']
})
export class WorkflowsPage implements OnInit {
  workflows$?: Observable<Workflow[]>;

  constructor(
    private automationService: AutomationService,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.workflows$ = this.automationService.getWorkflows();
  }

  async toggleWorkflow(workflow: Workflow) {
    this.automationService.toggleWorkflow(workflow.id).subscribe();
  }

  async executeWorkflow(workflow: Workflow, event: Event) {
    event.stopPropagation();
    const alert = await this.alertController.create({
      header: 'Execute Workflow',
      message: `Execute "${workflow.name}" now?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Execute',
          handler: () => {
            this.automationService.executeWorkflow(workflow.id).subscribe();
          }
        }
      ]
    });
    await alert.present();
  }

  async deleteWorkflow(workflow: Workflow, event: Event) {
    event.stopPropagation();
    const alert = await this.alertController.create({
      header: 'Delete Workflow',
      message: `Delete "${workflow.name}"?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.automationService.deleteWorkflow(workflow.id).subscribe();
          }
        }
      ]
    });
    await alert.present();
  }
}
