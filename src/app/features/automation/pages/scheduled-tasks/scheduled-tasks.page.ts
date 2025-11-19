import { Component, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { AutomationService } from '@core/services/automation.service';
import { ScheduledTask } from '@core/models/automation.model';

@Component({
  selector: 'app-scheduled-tasks',
  templateUrl: './scheduled-tasks.page.html',
  styleUrls: ['./scheduled-tasks.page.scss']
})
export class ScheduledTasksPage implements OnInit {
  tasks$?: Observable<ScheduledTask[]>;

  constructor(
    private automationService: AutomationService,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.tasks$ = this.automationService.getScheduledTasks();
  }

  async toggleTask(task: ScheduledTask) {
    this.automationService.toggleScheduledTask(task.id).subscribe();
  }

  async deleteTask(task: ScheduledTask, event: Event) {
    event.stopPropagation();
    const alert = await this.alertController.create({
      header: 'Delete Task',
      message: `Delete "${task.name}"?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Delete', role: 'destructive', handler: () => this.automationService.deleteScheduledTask(task.id).subscribe() }
      ]
    });
    await alert.present();
  }
}
