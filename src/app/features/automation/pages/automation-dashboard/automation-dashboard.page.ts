import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { AutomationService } from '@core/services/automation.service';
import { Workflow, ScheduledTask, AutoScalingPolicy } from '@core/models/automation.model';

@Component({
  selector: 'app-automation-dashboard',
  templateUrl: './automation-dashboard.page.html',
  styleUrls: ['./automation-dashboard.page.scss']
})
export class AutomationDashboardPage implements OnInit {
  workflows$?: Observable<Workflow[]>;
  scheduledTasks$?: Observable<ScheduledTask[]>;
  autoScalingPolicies$?: Observable<AutoScalingPolicy[]>;
  activeWorkflowsCount$?: Observable<number>;
  activeTasksCount$?: Observable<number>;
  activePoliciesCount$?: Observable<number>;

  constructor(
    private automationService: AutomationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.workflows$ = this.automationService.getWorkflows();
    this.scheduledTasks$ = this.automationService.getScheduledTasks();
    this.autoScalingPolicies$ = this.automationService.getAutoScalingPolicies();

    this.activeWorkflowsCount$ = this.workflows$.pipe(
      map(workflows => workflows.filter(w => w.enabled).length)
    );
    this.activeTasksCount$ = this.scheduledTasks$.pipe(
      map(tasks => tasks.filter(t => t.enabled).length)
    );
    this.activePoliciesCount$ = this.autoScalingPolicies$.pipe(
      map(policies => policies.filter(p => p.enabled).length)
    );
  }

  viewWorkflows() {
    this.router.navigate(['/automation/workflows']);
  }

  viewScheduledTasks() {
    this.router.navigate(['/automation/scheduled-tasks']);
  }

  viewAutoScaling() {
    this.router.navigate(['/automation/auto-scaling']);
  }
}
