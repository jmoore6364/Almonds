import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, interval } from 'rxjs';
import { map, delay } from 'rxjs/operators';

import {
  Workflow,
  WorkflowExecution,
  ScheduledTask,
  AutoScalingPolicy,
  ScalingEvent,
  CreateWorkflowDto,
  CreateScheduledTaskDto,
  CreateAutoScalingPolicyDto,
  TriggerType,
  ActionType,
  ExecutionStatus,
  ScheduleType
} from '@core/models/automation.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AutomationService {
  private workflowsSubject = new BehaviorSubject<Workflow[]>([]);
  private allWorkflowsSubject = new BehaviorSubject<Workflow[]>([]);
  private executionsSubject = new BehaviorSubject<WorkflowExecution[]>([]);
  private scheduledTasksSubject = new BehaviorSubject<ScheduledTask[]>([]);
  private allScheduledTasksSubject = new BehaviorSubject<ScheduledTask[]>([]);
  private autoScalingPoliciesSubject = new BehaviorSubject<AutoScalingPolicy[]>([]);
  private allAutoScalingPoliciesSubject = new BehaviorSubject<AutoScalingPolicy[]>([]);
  private scalingEventsSubject = new BehaviorSubject<ScalingEvent[]>([]);

  workflows$: Observable<Workflow[]>;
  scheduledTasks$: Observable<ScheduledTask[]>;
  autoScalingPolicies$: Observable<AutoScalingPolicy[]>;

  constructor(private authService: AuthService) {
    // Filter workflows by current organization
    this.workflows$ = combineLatest([
      this.allWorkflowsSubject.asObservable(),
      this.authService.getCurrentOrganization()
    ]).pipe(
      map(([workflows, currentOrg]) => {
        if (!currentOrg) return [];
        return workflows.filter(w => w.organizationId === currentOrg.id);
      })
    );

    // Filter scheduled tasks by current organization
    this.scheduledTasks$ = combineLatest([
      this.allScheduledTasksSubject.asObservable(),
      this.authService.getCurrentOrganization()
    ]).pipe(
      map(([tasks, currentOrg]) => {
        if (!currentOrg) return [];
        return tasks.filter(t => t.organizationId === currentOrg.id);
      })
    );

    // Filter auto-scaling policies by current organization
    this.autoScalingPolicies$ = combineLatest([
      this.allAutoScalingPoliciesSubject.asObservable(),
      this.authService.getCurrentOrganization()
    ]).pipe(
      map(([policies, currentOrg]) => {
        if (!currentOrg) return [];
        return policies.filter(p => p.organizationId === currentOrg.id);
      })
    );

    this.initializeMockData();
    this.startAutomationEngine();
  }

  private initializeMockData(): void {
    const mockWorkflows: Workflow[] = [
      {
        id: 'wf-1',
        organizationId: 'org-1',
        name: 'Nightly Backup',
        description: 'Backup all production databases every night at 2 AM',
        enabled: true,
        trigger: {
          type: TriggerType.SCHEDULE,
          config: {
            cron: '0 2 * * *',
            timezone: 'America/New_York'
          }
        },
        actions: [
          {
            id: 'action-1',
            type: ActionType.BACKUP_RESOURCE,
            config: {
              resourceIds: ['res-1', 'res-2']
            },
            orderIndex: 1,
            continueOnError: false
          },
          {
            id: 'action-2',
            type: ActionType.SEND_NOTIFICATION,
            config: {
              notificationConfig: {
                recipients: ['admin@example.com'],
                message: 'Nightly backup completed successfully',
                channel: 'email'
              }
            },
            orderIndex: 2,
            continueOnError: true
          }
        ],
        executionCount: 45,
        lastExecuted: new Date(Date.now() - 12 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        createdBy: 'user-1',
        updatedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'wf-2',
        organizationId: 'org-1',
        name: 'Weekend Shutdown',
        description: 'Stop non-production resources on Friday evening',
        enabled: true,
        trigger: {
          type: TriggerType.SCHEDULE,
          config: {
            cron: '0 18 * * 5',
            timezone: 'America/New_York'
          }
        },
        actions: [
          {
            id: 'action-3',
            type: ActionType.STOP_RESOURCE,
            config: {
              resourceIds: ['res-3', 'res-4']
            },
            orderIndex: 1,
            continueOnError: false
          }
        ],
        executionCount: 12,
        lastExecuted: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        createdBy: 'user-1',
        updatedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      }
    ];

    const mockScheduledTasks: ScheduledTask[] = [
      {
        id: 'st-1',
        organizationId: 'org-1',
        name: 'Daily Database Backup',
        description: 'Backup production database daily',
        enabled: true,
        schedule: {
          type: ScheduleType.DAILY,
          cron: '0 3 * * *',
          timezone: 'America/New_York'
        },
        action: {
          id: 'task-action-1',
          type: ActionType.BACKUP_RESOURCE,
          config: {
            resourceIds: ['res-1']
          },
          orderIndex: 1,
          continueOnError: false
        },
        resourceIds: ['res-1'],
        lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000),
        nextRun: new Date(Date.now() + 3 * 60 * 60 * 1000),
        executionCount: 30,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        createdBy: 'user-1'
      }
    ];

    const mockAutoScalingPolicies: AutoScalingPolicy[] = [
      {
        id: 'asp-1',
        organizationId: 'org-1',
        name: 'API Auto Scaling',
        description: 'Scale API servers based on CPU usage',
        enabled: true,
        resourceIds: ['res-1'],
        scaleUpRules: [
          {
            metric: 'cpu_usage',
            threshold: 75,
            operator: 'gt',
            duration: 5,
            scaleBy: 1,
            scaleType: 'absolute'
          }
        ],
        scaleDownRules: [
          {
            metric: 'cpu_usage',
            threshold: 30,
            operator: 'lt',
            duration: 10,
            scaleBy: 1,
            scaleType: 'absolute'
          }
        ],
        minInstances: 2,
        maxInstances: 10,
        cooldownPeriod: 5,
        lastScaled: new Date(Date.now() - 2 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        createdBy: 'user-1'
      }
    ];

    this.allWorkflowsSubject.next(mockWorkflows);
    this.allScheduledTasksSubject.next(mockScheduledTasks);
    this.allAutoScalingPoliciesSubject.next(mockAutoScalingPolicies);
  }

  private startAutomationEngine(): void {
    // Check for scheduled tasks and auto-scaling every minute
    interval(60 * 1000).subscribe(() => {
      this.processScheduledTasks();
      this.evaluateAutoScalingPolicies();
    });
  }

  private processScheduledTasks(): void {
    // In production, this would check and execute scheduled tasks
    console.log('Processing scheduled tasks...');
  }

  private evaluateAutoScalingPolicies(): void {
    // In production, this would evaluate auto-scaling policies
    console.log('Evaluating auto-scaling policies...');
  }

  // Workflow methods
  getWorkflows(): Observable<Workflow[]> {
    return this.workflows$;
  }

  getWorkflowById(id: string): Observable<Workflow | undefined> {
    return this.workflows$.pipe(
      map(workflows => workflows.find(w => w.id === id))
    );
  }

  createWorkflow(dto: CreateWorkflowDto): Observable<Workflow> {
    return combineLatest([
      this.authService.getCurrentOrganization(),
      this.authService.getAuthState()
    ]).pipe(
      map(([currentOrg, authState]) => {
        const actions = dto.actions.map((action, index) => ({
          ...action,
          id: `action-${Date.now()}-${index}`,
          orderIndex: index + 1
        }));

        const newWorkflow: Workflow = {
          id: `wf-${Date.now()}`,
          organizationId: currentOrg.id,
          name: dto.name,
          description: dto.description,
          enabled: dto.enabled !== undefined ? dto.enabled : true,
          trigger: dto.trigger,
          actions,
          conditions: dto.conditions,
          executionCount: 0,
          createdAt: new Date(),
          createdBy: authState.user?.id || 'unknown',
          updatedAt: new Date()
        };

        const current = this.allWorkflowsSubject.value;
        this.allWorkflowsSubject.next([...current, newWorkflow]);

        return newWorkflow;
      }),
      delay(500)
    );
  }

  updateWorkflow(id: string, updates: Partial<Workflow>): Observable<Workflow> {
    const current = this.allWorkflowsSubject.value;
    const index = current.findIndex(w => w.id === id);

    if (index === -1) {
      throw new Error('Workflow not found');
    }

    const updated = { ...current[index], ...updates, updatedAt: new Date() };
    current[index] = updated;
    this.allWorkflowsSubject.next([...current]);

    return new Observable(observer => {
      setTimeout(() => {
        observer.next(updated);
        observer.complete();
      }, 500);
    });
  }

  deleteWorkflow(id: string): Observable<boolean> {
    const current = this.allWorkflowsSubject.value;
    const filtered = current.filter(w => w.id !== id);
    this.allWorkflowsSubject.next(filtered);

    return new Observable(observer => {
      setTimeout(() => {
        observer.next(true);
        observer.complete();
      }, 500);
    });
  }

  toggleWorkflow(id: string): Observable<Workflow> {
    const current = this.allWorkflowsSubject.value;
    const workflow = current.find(w => w.id === id);

    if (!workflow) {
      throw new Error('Workflow not found');
    }

    return this.updateWorkflow(id, { enabled: !workflow.enabled });
  }

  executeWorkflow(id: string): Observable<WorkflowExecution> {
    return this.authService.getAuthState().pipe(
      map(authState => {
        const execution: WorkflowExecution = {
          id: `exec-${Date.now()}`,
          workflowId: id,
          status: ExecutionStatus.COMPLETED,
          startTime: new Date(),
          endTime: new Date(Date.now() + 5000),
          duration: 5,
          triggeredBy: authState.user?.id || 'unknown',
          results: []
        };

        const executions = this.executionsSubject.value;
        this.executionsSubject.next([...executions, execution]);

        // Update workflow execution count
        const workflows = this.allWorkflowsSubject.value;
        const workflow = workflows.find(w => w.id === id);
        if (workflow) {
          workflow.executionCount++;
          workflow.lastExecuted = new Date();
          this.allWorkflowsSubject.next([...workflows]);
        }

        return execution;
      }),
      delay(1000)
    );
  }

  getWorkflowExecutions(workflowId: string): Observable<WorkflowExecution[]> {
    return this.executionsSubject.pipe(
      map(executions => executions.filter(e => e.workflowId === workflowId))
    );
  }

  // Scheduled task methods
  getScheduledTasks(): Observable<ScheduledTask[]> {
    return this.scheduledTasks$;
  }

  createScheduledTask(dto: CreateScheduledTaskDto): Observable<ScheduledTask> {
    return combineLatest([
      this.authService.getCurrentOrganization(),
      this.authService.getAuthState()
    ]).pipe(
      map(([currentOrg, authState]) => {
        const action = {
          ...dto.action,
          id: `task-action-${Date.now()}`
        };

        const newTask: ScheduledTask = {
          id: `st-${Date.now()}`,
          organizationId: currentOrg.id,
          name: dto.name,
          description: dto.description,
          enabled: dto.enabled !== undefined ? dto.enabled : true,
          schedule: dto.schedule,
          action,
          resourceIds: dto.resourceIds,
          nextRun: this.calculateNextRun(dto.schedule),
          executionCount: 0,
          createdAt: new Date(),
          createdBy: authState.user?.id || 'unknown'
        };

        const current = this.allScheduledTasksSubject.value;
        this.allScheduledTasksSubject.next([...current, newTask]);

        return newTask;
      }),
      delay(500)
    );
  }

  private calculateNextRun(schedule: any): Date {
    // Simple mock implementation - would use cron parser in production
    return new Date(Date.now() + 24 * 60 * 60 * 1000);
  }

  deleteScheduledTask(id: string): Observable<boolean> {
    const current = this.allScheduledTasksSubject.value;
    const filtered = current.filter(t => t.id !== id);
    this.allScheduledTasksSubject.next(filtered);

    return new Observable(observer => {
      setTimeout(() => {
        observer.next(true);
        observer.complete();
      }, 500);
    });
  }

  toggleScheduledTask(id: string): Observable<ScheduledTask> {
    const current = this.allScheduledTasksSubject.value;
    const task = current.find(t => t.id === id);

    if (!task) {
      throw new Error('Scheduled task not found');
    }

    const updated = { ...task, enabled: !task.enabled };
    const index = current.findIndex(t => t.id === id);
    current[index] = updated;
    this.allScheduledTasksSubject.next([...current]);

    return new Observable(observer => {
      setTimeout(() => {
        observer.next(updated);
        observer.complete();
      }, 500);
    });
  }

  // Auto-scaling policy methods
  getAutoScalingPolicies(): Observable<AutoScalingPolicy[]> {
    return this.autoScalingPolicies$;
  }

  createAutoScalingPolicy(dto: CreateAutoScalingPolicyDto): Observable<AutoScalingPolicy> {
    return combineLatest([
      this.authService.getCurrentOrganization(),
      this.authService.getAuthState()
    ]).pipe(
      map(([currentOrg, authState]) => {
        const newPolicy: AutoScalingPolicy = {
          id: `asp-${Date.now()}`,
          organizationId: currentOrg.id,
          name: dto.name,
          description: dto.description,
          enabled: dto.enabled !== undefined ? dto.enabled : true,
          resourceIds: dto.resourceIds,
          scaleUpRules: dto.scaleUpRules,
          scaleDownRules: dto.scaleDownRules,
          minInstances: dto.minInstances,
          maxInstances: dto.maxInstances,
          cooldownPeriod: dto.cooldownPeriod,
          createdAt: new Date(),
          createdBy: authState.user?.id || 'unknown'
        };

        const current = this.allAutoScalingPoliciesSubject.value;
        this.allAutoScalingPoliciesSubject.next([...current, newPolicy]);

        return newPolicy;
      }),
      delay(500)
    );
  }

  deleteAutoScalingPolicy(id: string): Observable<boolean> {
    const current = this.allAutoScalingPoliciesSubject.value;
    const filtered = current.filter(p => p.id !== id);
    this.allAutoScalingPoliciesSubject.next(filtered);

    return new Observable(observer => {
      setTimeout(() => {
        observer.next(true);
        observer.complete();
      }, 500);
    });
  }

  toggleAutoScalingPolicy(id: string): Observable<AutoScalingPolicy> {
    const current = this.allAutoScalingPoliciesSubject.value;
    const policy = current.find(p => p.id === id);

    if (!policy) {
      throw new Error('Auto-scaling policy not found');
    }

    const updated = { ...policy, enabled: !policy.enabled };
    const index = current.findIndex(p => p.id === id);
    current[index] = updated;
    this.allAutoScalingPoliciesSubject.next([...current]);

    return new Observable(observer => {
      setTimeout(() => {
        observer.next(updated);
        observer.complete();
      }, 500);
    });
  }

  getScalingEvents(policyId?: string): Observable<ScalingEvent[]> {
    return this.scalingEventsSubject.pipe(
      map(events => policyId ? events.filter(e => e.policyId === policyId) : events)
    );
  }
}
