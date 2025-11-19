import { Component, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { AutomationService } from '@core/services/automation.service';
import { AutoScalingPolicy } from '@core/models/automation.model';

@Component({
  selector: 'app-auto-scaling',
  templateUrl: './auto-scaling.page.html',
  styleUrls: ['./auto-scaling.page.scss']
})
export class AutoScalingPage implements OnInit {
  policies$?: Observable<AutoScalingPolicy[]>;

  constructor(
    private automationService: AutomationService,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.policies$ = this.automationService.getAutoScalingPolicies();
  }

  async togglePolicy(policy: AutoScalingPolicy) {
    this.automationService.toggleAutoScalingPolicy(policy.id).subscribe();
  }

  async deletePolicy(policy: AutoScalingPolicy, event: Event) {
    event.stopPropagation();
    const alert = await this.alertController.create({
      header: 'Delete Policy',
      message: `Delete "${policy.name}"?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Delete', role: 'destructive', handler: () => this.automationService.deleteAutoScalingPolicy(policy.id).subscribe() }
      ]
    });
    await alert.present();
  }
}
