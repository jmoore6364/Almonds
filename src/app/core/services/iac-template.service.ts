import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, delay } from 'rxjs/operators';

import {
  IacTemplate,
  CreateIacTemplateDto,
  IacDeployment,
  DeployTemplateDto,
  IacTemplateType,
  TemplateStatus,
  DeploymentStatus
} from '@core/models/integration.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class IacTemplateService {
  private templatesSubject = new BehaviorSubject<IacTemplate[]>([]);
  private allTemplatesSubject = new BehaviorSubject<IacTemplate[]>([]);
  private deploymentsSubject = new BehaviorSubject<IacDeployment[]>([]);

  templates$: Observable<IacTemplate[]>;

  constructor(private authService: AuthService) {
    // Filter templates by current organization or public templates
    this.templates$ = combineLatest([
      this.allTemplatesSubject.asObservable(),
      this.authService.getCurrentOrganization()
    ]).pipe(
      map(([templates, currentOrg]) => {
        if (!currentOrg) return [];
        return templates.filter(
          t => t.organizationId === currentOrg.id || t.isPublic
        );
      })
    );

    this.initializeMockData();
  }

  private initializeMockData(): void {
    const mockTemplates: IacTemplate[] = [
      {
        id: 'template-1',
        organizationId: 'org-1',
        name: 'AWS EC2 Web Server',
        description: 'Deploy a basic EC2 instance with NGINX web server',
        type: IacTemplateType.TERRAFORM,
        category: 'Compute',
        tags: ['aws', 'ec2', 'web-server', 'nginx'],
        content: `resource "aws_instance" "web" {
  ami           = var.ami_id
  instance_type = var.instance_type

  tags = {
    Name = var.instance_name
  }
}`,
        variables: [
          {
            name: 'ami_id',
            type: 'string',
            description: 'AMI ID for the EC2 instance',
            required: true
          },
          {
            name: 'instance_type',
            type: 'string',
            description: 'EC2 instance type',
            required: true,
            default: 't2.micro',
            validation: {
              allowedValues: ['t2.micro', 't2.small', 't2.medium', 't3.micro', 't3.small', 't3.medium']
            }
          },
          {
            name: 'instance_name',
            type: 'string',
            description: 'Name tag for the EC2 instance',
            required: true
          }
        ],
        outputs: [
          {
            name: 'instance_id',
            description: 'The ID of the EC2 instance',
            sensitive: false
          },
          {
            name: 'public_ip',
            description: 'Public IP address of the instance',
            sensitive: false
          }
        ],
        version: '1.0.0',
        status: TemplateStatus.PUBLISHED,
        isPublic: true,
        deployments: 45,
        rating: 4.5,
        author: 'user-1',
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'template-2',
        organizationId: 'org-1',
        name: 'Azure App Service',
        description: 'Deploy an Azure App Service with auto-scaling',
        type: IacTemplateType.TERRAFORM,
        category: 'Platform as a Service',
        tags: ['azure', 'app-service', 'paas', 'auto-scaling'],
        content: `resource "azurerm_app_service_plan" "main" {
  name                = var.app_service_plan_name
  location            = var.location
  resource_group_name = var.resource_group_name
  sku {
    tier = var.tier
    size = var.size
  }
}

resource "azurerm_app_service" "main" {
  name                = var.app_service_name
  location            = var.location
  resource_group_name = var.resource_group_name
  app_service_plan_id = azurerm_app_service_plan.main.id
}`,
        variables: [
          {
            name: 'app_service_plan_name',
            type: 'string',
            description: 'Name of the App Service Plan',
            required: true
          },
          {
            name: 'app_service_name',
            type: 'string',
            description: 'Name of the App Service',
            required: true
          },
          {
            name: 'location',
            type: 'string',
            description: 'Azure region',
            required: true,
            default: 'eastus'
          },
          {
            name: 'resource_group_name',
            type: 'string',
            description: 'Name of the resource group',
            required: true
          },
          {
            name: 'tier',
            type: 'string',
            description: 'Service plan tier',
            required: false,
            default: 'Standard',
            validation: {
              allowedValues: ['Free', 'Shared', 'Basic', 'Standard', 'Premium']
            }
          },
          {
            name: 'size',
            type: 'string',
            description: 'Service plan size',
            required: false,
            default: 'S1'
          }
        ],
        outputs: [
          {
            name: 'app_service_id',
            description: 'The ID of the App Service',
            sensitive: false
          },
          {
            name: 'default_hostname',
            description: 'The default hostname of the App Service',
            sensitive: false
          }
        ],
        version: '1.2.0',
        status: TemplateStatus.PUBLISHED,
        isPublic: true,
        deployments: 32,
        rating: 4.7,
        author: 'user-2',
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'template-3',
        organizationId: 'org-1',
        name: 'PostgreSQL Database',
        description: 'Deploy a managed PostgreSQL database on AWS RDS',
        type: IacTemplateType.CLOUDFORMATION,
        category: 'Database',
        tags: ['aws', 'rds', 'postgresql', 'database'],
        content: `{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Resources": {
    "PostgreSQLDB": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "DBInstanceClass": { "Ref": "DBInstanceClass" },
        "Engine": "postgres",
        "EngineVersion": { "Ref": "EngineVersion" },
        "MasterUsername": { "Ref": "MasterUsername" },
        "MasterUserPassword": { "Ref": "MasterUserPassword" },
        "AllocatedStorage": { "Ref": "AllocatedStorage" }
      }
    }
  }
}`,
        variables: [
          {
            name: 'DBInstanceClass',
            type: 'string',
            description: 'Database instance class',
            required: true,
            default: 'db.t3.micro'
          },
          {
            name: 'EngineVersion',
            type: 'string',
            description: 'PostgreSQL version',
            required: true,
            default: '14.7'
          },
          {
            name: 'MasterUsername',
            type: 'string',
            description: 'Master username',
            required: true
          },
          {
            name: 'MasterUserPassword',
            type: 'string',
            description: 'Master password',
            required: true
          },
          {
            name: 'AllocatedStorage',
            type: 'number',
            description: 'Allocated storage in GB',
            required: true,
            default: 20,
            validation: {
              min: 20,
              max: 1000
            }
          }
        ],
        outputs: [
          {
            name: 'DBEndpoint',
            description: 'Database endpoint',
            sensitive: false
          },
          {
            name: 'DBPort',
            description: 'Database port',
            sensitive: false
          }
        ],
        version: '1.0.0',
        status: TemplateStatus.PUBLISHED,
        isPublic: false,
        deployments: 12,
        author: 'user-1',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      }
    ];

    this.allTemplatesSubject.next(mockTemplates);
  }

  getTemplates(): Observable<IacTemplate[]> {
    return this.templates$;
  }

  getTemplateById(id: string): Observable<IacTemplate | undefined> {
    return this.templates$.pipe(
      map(templates => templates.find(t => t.id === id))
    );
  }

  getTemplatesByType(type: IacTemplateType): Observable<IacTemplate[]> {
    return this.templates$.pipe(
      map(templates => templates.filter(t => t.type === type))
    );
  }

  getTemplatesByCategory(category: string): Observable<IacTemplate[]> {
    return this.templates$.pipe(
      map(templates => templates.filter(t => t.category === category))
    );
  }

  createTemplate(dto: CreateIacTemplateDto): Observable<IacTemplate> {
    return combineLatest([
      this.authService.getCurrentOrganization(),
      this.authService.getAuthState()
    ]).pipe(
      map(([currentOrg, authState]) => {
        const newTemplate: IacTemplate = {
          id: `template-${Date.now()}`,
          organizationId: currentOrg.id,
          name: dto.name,
          description: dto.description,
          type: dto.type,
          category: dto.category,
          tags: dto.tags,
          content: dto.content,
          variables: dto.variables,
          outputs: dto.outputs,
          version: '1.0.0',
          status: TemplateStatus.DRAFT,
          isPublic: dto.isPublic || false,
          deployments: 0,
          author: authState.user?.id || 'unknown',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const current = this.allTemplatesSubject.value;
        this.allTemplatesSubject.next([...current, newTemplate]);

        return newTemplate;
      }),
      delay(500)
    );
  }

  updateTemplate(id: string, updates: Partial<IacTemplate>): Observable<IacTemplate> {
    const current = this.allTemplatesSubject.value;
    const index = current.findIndex(t => t.id === id);

    if (index === -1) {
      throw new Error('Template not found');
    }

    const updated = { ...current[index], ...updates, updatedAt: new Date() };
    current[index] = updated;
    this.allTemplatesSubject.next([...current]);

    return new Observable(observer => {
      setTimeout(() => {
        observer.next(updated);
        observer.complete();
      }, 500);
    });
  }

  deleteTemplate(id: string): Observable<boolean> {
    const current = this.allTemplatesSubject.value;
    const filtered = current.filter(t => t.id !== id);
    this.allTemplatesSubject.next(filtered);

    return new Observable(observer => {
      setTimeout(() => {
        observer.next(true);
        observer.complete();
      }, 500);
    });
  }

  publishTemplate(id: string): Observable<IacTemplate> {
    return this.updateTemplate(id, { status: TemplateStatus.PUBLISHED });
  }

  deployTemplate(dto: DeployTemplateDto): Observable<IacDeployment> {
    return combineLatest([
      this.authService.getCurrentOrganization(),
      this.authService.getAuthState()
    ]).pipe(
      map(([currentOrg, authState]) => {
        const deployment: IacDeployment = {
          id: `deploy-${Date.now()}`,
          templateId: dto.templateId,
          organizationId: currentOrg.id,
          name: dto.name,
          status: DeploymentStatus.PENDING,
          inputs: dto.inputs,
          resources: [],
          startedAt: new Date(),
          deployedBy: authState.user?.id || 'unknown',
          logs: ['Deployment initiated...', 'Validating template...', 'Starting deployment...']
        };

        const deployments = this.deploymentsSubject.value;
        this.deploymentsSubject.next([...deployments, deployment]);

        // Simulate deployment progress
        setTimeout(() => {
          deployment.status = DeploymentStatus.DEPLOYING;
          deployment.logs.push('Creating resources...');
          this.deploymentsSubject.next([...this.deploymentsSubject.value]);
        }, 2000);

        setTimeout(() => {
          deployment.status = DeploymentStatus.COMPLETED;
          deployment.completedAt = new Date();
          deployment.duration = 5000;
          deployment.logs.push('Deployment completed successfully');
          this.deploymentsSubject.next([...this.deploymentsSubject.value]);
        }, 5000);

        return deployment;
      }),
      delay(500)
    );
  }

  getDeployments(): Observable<IacDeployment[]> {
    return combineLatest([
      this.deploymentsSubject.asObservable(),
      this.authService.getCurrentOrganization()
    ]).pipe(
      map(([deployments, currentOrg]) => {
        if (!currentOrg) return [];
        return deployments.filter(d => d.organizationId === currentOrg.id);
      })
    );
  }

  getDeploymentById(id: string): Observable<IacDeployment | undefined> {
    return this.getDeployments().pipe(
      map(deployments => deployments.find(d => d.id === id))
    );
  }

  validateTemplate(content: string, type: IacTemplateType): Observable<{ valid: boolean; errors: string[] }> {
    // Mock validation - in production would use actual IaC validators
    return new Observable(observer => {
      setTimeout(() => {
        observer.next({
          valid: true,
          errors: []
        });
        observer.complete();
      }, 1000);
    });
  }
}
