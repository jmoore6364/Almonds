# Almonds Resource Manager

A unified web/mobile platform built with Ionic and Angular for managing cloud resources across multiple providers. Streamline your DevOps workflow by managing AWS, Azure, Railway, Supabase, and other cloud platforms from a single, intuitive dashboard.

![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Mobile-blue)
![Framework](https://img.shields.io/badge/Framework-Ionic%20%7C%20Angular-purple)
![License](https://img.shields.io/badge/License-MIT-green)

## Features

### Multi-Provider Resource Management
- **Unified Dashboard**: View and manage resources from all connected cloud providers in one place
- **Supported Providers**:
  - Amazon Web Services (AWS)
  - Microsoft Azure
  - Railway
  - Supabase
  - Google Cloud Platform (GCP)
  - Vercel
  - Netlify
  - Custom providers

### Resource Monitoring
- Real-time resource status tracking
- Cost monitoring and optimization insights
- Resource grouping and tagging
- Detailed resource metadata views
- Performance metrics and monitoring

### Developer Training
- Built-in training modules for new developers
- Progressive learning paths (Beginner → Intermediate → Advanced)
- Platform-specific tutorials:
  - Introduction to Cloud Computing
  - AWS Fundamentals
  - Azure Basics
  - Resource Management Best Practices
- Interactive lessons and quizzes

### Multi-Tenancy & Organizations
- **Full Multi-Tenant Architecture**: Complete organization isolation for enterprise use
- **Organization Management**:
  - Create and manage multiple organizations
  - Switch between organizations seamlessly
  - Organization-specific resource isolation
  - Dedicated settings and preferences per organization
- **Team Collaboration**:
  - Invite team members via email
  - Granular role-based permissions (Owner, Admin, Developer, Viewer, Billing)
  - Member management and access control
  - Pending invitation tracking
- **Flexible Plans**: Support for Free, Starter, Professional, and Enterprise tiers
- **Isolated Resources**: All resources, providers, and settings are organization-scoped
- **Organization Dashboard**: Stats, member count, and cost tracking per organization

### Analytics & Reporting
- **Cost Analytics Dashboard**: Comprehensive cost tracking and visualization
  - Total cost overview with trend indicators
  - Cost breakdown by provider, resource type, and region
  - Month-over-month and year-over-year comparisons
  - Cost forecasting for next month, quarter, and year
- **Usage Analytics**: Monitor resource utilization and performance
  - Resource usage metrics (total, active, inactive, error states)
  - Overall utilization percentage with visual gauges
  - Performance metrics (uptime, response time, error rate)
- **Cost Optimization Recommendations**: AI-powered cost saving suggestions
  - Rightsizing recommendations for over/under-provisioned resources
  - Reserved instance and spot instance opportunities
  - Unused resource identification
  - Scheduling suggestions for non-production resources
  - Priority-based recommendations with potential savings calculations
  - Action items and affected resource tracking
- **Budget Alerts**: Proactive cost monitoring
  - Multiple budget thresholds (warning, critical)
  - Real-time budget consumption tracking
  - Alert notifications when thresholds are exceeded
  - Historical budget trend analysis
- **Export Capabilities**: Download reports in multiple formats (CSV, PDF, JSON)

### Automation & Workflows
- **Workflow Automation Engine**: Create and manage automated workflows
  - Multiple trigger types: schedule, event, webhook, manual, alert, metric threshold
  - Flexible workflow actions: start/stop/restart/scale resources, backups, notifications, webhooks, scripts
  - Workflow execution tracking and history
  - Enable/disable workflows dynamically
- **Scheduled Tasks**: Automate recurring operations
  - Cron-based scheduling with multiple schedule types
  - Task execution tracking with next run calculation
  - Support for daily, weekly, monthly, and custom schedules
- **Auto-Scaling Policies**: Automatic resource scaling
  - Scale-up and scale-down rules based on metrics
  - Min/max instance limits with cooldown periods
  - Multiple scaling rules per policy
  - Scaling event history and tracking

### Audit & Compliance
- **Comprehensive Audit Logging**: Track all user actions and system events
  - User activity logging with timestamps, IP addresses, and user agents
  - Resource change tracking with before/after states
  - Success/failure status tracking
  - Audit log filtering, search, and export (CSV, JSON, PDF)
- **Compliance Reporting**: Multi-framework compliance tracking
  - Support for SOC 2, HIPAA, GDPR, ISO 27001, PCI DSS
  - Automated compliance report generation
  - Compliance findings with severity levels and remediation guidance
  - Compliance score calculations and trends
  - Control tracking and evidence management
- **Data Retention Policies**: Automated data lifecycle management
  - Configurable retention periods
  - Data type-specific policies

### Advanced Integrations & API
- **API Access Layer**: Programmatic access to all platform features
  - Secure API key generation with scope-based permissions
  - Rate limiting (requests per minute/hour/day, burst limits)
  - Usage tracking and analytics (requests, bandwidth, error rates)
  - IP whitelisting and key expiration
  - Multiple API scopes for granular access control
- **Webhook Management**: Real-time event notifications
  - Event subscriptions (resources, alerts, workflows, scaling, compliance, budgets)
  - Webhook testing with sample payloads
  - Retry logic with configurable backoff
  - Delivery statistics and health monitoring
  - Custom headers and webhook secrets
- **Infrastructure as Code (IaC)**: Deploy infrastructure from templates
  - Template library (Terraform, CloudFormation, Pulumi, Ansible, Custom)
  - Template variables with validation rules
  - One-click deployment from templates
  - Deployment tracking and monitoring
  - Public and private template sharing
  - Template versioning and categorization

### Security & Authentication
- Secure credential storage with encryption
- Multi-level role-based access control (RBAC)
  - User roles: Admin, Developer, Viewer, Trainee
  - Organization roles: Owner, Admin, Developer, Viewer, Billing
- OAuth integration support
- Session management
- MFA enforcement options per organization
- Secure organization switching with context preservation

### Cross-Platform
- **Web**: Responsive design for desktop and tablet browsers
- **Mobile**: Native iOS and Android apps via Capacitor
- Offline-first architecture with sync capabilities

## Architecture

### Technology Stack

```
Frontend:
├── Ionic 7.5+          # UI Framework
├── Angular 17+         # Application Framework
├── TypeScript 5.2+     # Programming Language
├── NgRx                # State Management
├── RxJS                # Reactive Programming
└── Capacitor           # Native Mobile Runtime

Backend Integration:
├── AWS SDK             # Amazon Web Services
├── Azure SDK           # Microsoft Azure
├── REST APIs           # Railway, Supabase, etc.
└── Custom Adapters     # Extensible provider system
```

### Project Structure

```
src/
├── app/
│   ├── core/                      # Core services and models
│   │   ├── models/               # Data models and interfaces
│   │   │   ├── resource.model.ts
│   │   │   ├── provider.model.ts
│   │   │   ├── user.model.ts
│   │   │   ├── training.model.ts
│   │   │   ├── organization.model.ts
│   │   │   └── analytics.model.ts
│   │   └── services/             # Business logic services
│   │       ├── resource.service.ts
│   │       ├── provider.service.ts
│   │       ├── auth.service.ts
│   │       ├── training.service.ts
│   │       ├── organization.service.ts
│   │       ├── analytics.service.ts
│   │       └── providers/        # Cloud provider integrations
│   │           ├── base-provider.service.ts
│   │           ├── aws-provider.service.ts
│   │           ├── azure-provider.service.ts
│   │           ├── railway-provider.service.ts
│   │           └── supabase-provider.service.ts
│   │
│   └── features/                  # Feature modules
│       ├── dashboard/            # Main dashboard
│       ├── resources/            # Resource management
│       ├── providers/            # Provider connections
│       ├── training/             # Training modules
│       ├── organization/         # Multi-tenancy & team management
│       ├── analytics/            # Cost analytics & reporting
│       ├── alerts/               # Alerts & monitoring
│       ├── automation/           # Workflow automation
│       ├── audit/                # Audit logs & compliance
│       ├── integrations/         # API keys, webhooks, IaC templates
│       └── auth/                 # Authentication
│
├── theme/                         # Ionic theming
└── assets/                        # Static assets
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- Angular CLI: `npm install -g @angular/cli`
- Ionic CLI: `npm install -g @ionic/cli`
- (Optional) For mobile: Capacitor CLI

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/almonds-resource-manager.git
   cd almonds-resource-manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   # Web development server
   npm start
   # or
   ionic serve
   ```

4. **Access the application**
   Open your browser to `http://localhost:4200`

### Building for Production

#### Web Application
```bash
# Production build
npm run build

# The build artifacts will be stored in the `www/` directory
```

#### Mobile Applications

1. **Add platforms**
   ```bash
   # iOS
   ionic capacitor add ios

   # Android
   ionic capacitor add android
   ```

2. **Build and sync**
   ```bash
   ionic build
   ionic capacitor sync
   ```

3. **Open in native IDE**
   ```bash
   # iOS (requires macOS with Xcode)
   ionic capacitor open ios

   # Android (requires Android Studio)
   ionic capacitor open android
   ```

## Usage

### First-Time Setup

1. **Login**
   - Navigate to the login page
   - Use any email and password (min 6 characters) for demo mode
   - For production, integrate with your authentication provider

2. **Connect Cloud Providers**
   - Go to "Providers" from the dashboard
   - Click "Connect" on any provider
   - Enter your API credentials
   - Test the connection
   - Save and sync resources

3. **View Resources**
   - Navigate to "Resources"
   - Filter by provider, type, or search
   - Click on any resource for detailed information

4. **Explore Training**
   - Access "Training Modules" from the dashboard
   - Start with beginner modules
   - Track your progress

### Multi-Tenancy & Organization Management

#### Creating an Organization

1. **Create Your First Organization**
   - After login, you can create a new organization
   - Provide organization name, slug (URL-friendly identifier), and description
   - Select a plan (Free, Starter, Professional, Enterprise)
   - The slug must be unique and URL-safe (lowercase, numbers, hyphens)

2. **Organization Dashboard**
   - View organization statistics (members, resources, costs)
   - Access organization settings
   - Manage team members

#### Managing Team Members

1. **Invite Members**
   - Navigate to Organization → Team Members
   - Click "Invite" and enter the member's email
   - Select their role:
     - **Owner**: Full control including billing and deletion
     - **Admin**: Manage resources, members, and settings
     - **Developer**: Manage resources and providers
     - **Viewer**: Read-only access
     - **Billing**: Manage billing and payment methods
   - Add optional personal message
   - Send invitation

2. **Manage Existing Members**
   - Update member roles
   - Remove members from organization
   - View member activity and last login

3. **Invitation Management**
   - View pending invitations
   - Resend or cancel invitations
   - Invitations expire after 7 days

#### Switching Organizations

1. **Access Organization Switcher**
   - Click on organization name in header/sidebar
   - View list of all organizations you're a member of

2. **Switch Context**
   - Select the organization you want to work with
   - All resources, providers, and settings update automatically
   - Current organization is persisted across sessions

3. **Create Additional Organizations**
   - Users can be members of multiple organizations
   - Each organization has completely isolated resources
   - Switch seamlessly between different contexts

#### Organization Settings

1. **Basic Information**
   - Update organization name, description, and website
   - View and upgrade plan
   - Access billing and subscription management

2. **Security Settings**
   - Require MFA for all organization members
   - Control public resource access
   - Set data retention policies (7-365 days)

3. **Notification Preferences**
   - Configure email notifications
   - Set up resource alerts
   - Enable cost alerts and budget thresholds
   - Configure security alerts
   - Opt-in to weekly usage reports

4. **Danger Zone**
   - Delete organization (requires confirmation)
   - Permanently removes all resources, members, and data

### Analytics & Cost Tracking

#### Viewing Cost Analytics

1. **Access Analytics Dashboard**
   - Navigate to Analytics from the main menu
   - View cost overview card with total costs and trends
   - See provider breakdown with interactive charts
   - Monitor budget alerts and consumption

2. **Detailed Cost Analysis**
   - Click "View Detailed Analysis" to access comprehensive cost breakdown
   - Filter by time range (Week, Month, Quarter, Year)
   - Group costs by provider, resource type, or region
   - View historical trends and forecasts
   - Export data for external analysis

#### Usage Analytics

1. **Resource Usage Metrics**
   - Navigate to Analytics → Usage Analytics
   - View total, active, inactive, and error resource counts
   - Monitor overall utilization percentage
   - Track performance metrics (uptime, response time, error rate)

2. **Performance Monitoring**
   - Real-time uptime tracking
   - Average response time monitoring
   - Error rate analysis with trend indicators

#### Cost Optimization

1. **View Recommendations**
   - Navigate to Analytics → Optimization
   - See all active recommendations sorted by priority
   - Each recommendation shows:
     - Potential savings amount and percentage
     - Priority level (1-5 stars)
     - Implementation effort (Low, Medium, High)
     - Impact level (Low, Medium, High)
     - Affected resources count
     - Detailed action items

2. **Apply Recommendations**
   - Review recommendation details and action items
   - Click "View Resources" to see affected resources
   - Click "Apply Recommendation" to implement changes
   - Track savings over time

3. **Budget Management**
   - Set budget thresholds in Organization Settings
   - Receive alerts when approaching limits (warning, critical)
   - View budget consumption percentage
   - Monitor spending trends to stay within budget

### Alerts & Monitoring

#### Creating Alerts

1. **Access Alerts Management**
   - Navigate to Alerts → Management
   - Click "Add" to create a new alert
   - Configure alert conditions and actions

2. **Alert Types**
   - Cost alerts: Monitor spending thresholds
   - Resource status alerts: Track resource availability
   - Performance alerts: Monitor response times and metrics
   - Security alerts: Detect security-related events
   - Health alerts: Monitor service health
   - Custom alerts: Define custom conditions

3. **Alert Actions**
   - Email notifications
   - SMS notifications
   - Webhook calls
   - Slack integration
   - Push notifications
   - In-app notifications

#### Health Monitoring

1. **Create Health Checks**
   - Navigate to Alerts → Health Monitoring
   - Select resource to monitor
   - Configure check type (HTTP, HTTPS, TCP, ping, database, API)
   - Set check interval and timeout
   - Enable the health check

2. **Monitor Service Health**
   - View overall service health dashboard
   - Track uptime percentages (24h, 7d, 30d)
   - Monitor active incidents
   - View health check history

### Workflow Automation

#### Creating Workflows

1. **Access Workflow Management**
   - Navigate to Automation → Workflows
   - Create new workflow with trigger and actions

2. **Workflow Triggers**
   - Schedule-based (cron expressions)
   - Event-based (resource events)
   - Webhook triggers
   - Manual execution
   - Alert-based triggers
   - Metric threshold triggers

3. **Workflow Actions**
   - Start/stop/restart resources
   - Scale resources
   - Create backups
   - Send notifications
   - Execute webhooks
   - Run custom scripts
   - Create/delete snapshots
   - Update resource tags

#### Scheduled Tasks

1. **Create Scheduled Tasks**
   - Navigate to Automation → Scheduled Tasks
   - Define task schedule (daily, weekly, monthly, cron)
   - Configure task action
   - Select target resources
   - Enable the scheduled task

2. **Monitor Task Execution**
   - View next run time
   - Track execution count
   - Review execution history

#### Auto-Scaling

1. **Create Auto-Scaling Policies**
   - Navigate to Automation → Auto-Scaling
   - Define scale-up rules (e.g., CPU > 75%)
   - Define scale-down rules (e.g., CPU < 30%)
   - Set min/max instance limits
   - Configure cooldown period

2. **Monitor Scaling Events**
   - View scaling event history
   - Track current instance counts
   - Review scaling decisions

### Audit & Compliance

#### Viewing Audit Logs

1. **Access Audit Logs**
   - Navigate to Audit → Logs
   - View all user actions and system events
   - Filter by date, user, action type, or resource
   - Export logs in CSV, JSON, or PDF format

2. **Audit Log Information**
   - User who performed the action
   - Action type (create, update, delete, login, etc.)
   - Resource affected
   - Timestamp and IP address
   - Before/after states for changes
   - Success or failure status

#### Compliance Reporting

1. **Generate Compliance Reports**
   - Navigate to Audit → Compliance
   - Click "Generate Report"
   - Select compliance framework (SOC 2, HIPAA, GDPR, ISO 27001, PCI DSS)
   - Wait for report generation

2. **Review Compliance Reports**
   - View compliance score
   - Review findings by severity
   - Check control status
   - Review recommendations
   - Access evidence and documentation
   - Export compliance reports

### Connecting Providers

#### AWS
```
Required Credentials:
- Access Key ID
- Secret Access Key
- Region (e.g., us-east-1)

Recommended IAM Permissions:
- ec2:Describe*
- rds:Describe*
- s3:ListAllMyBuckets
```

#### Azure
```
Required Credentials:
- Tenant ID
- Client ID
- Client Secret

Required Permissions:
- Reader role on subscription
```

#### Railway
```
Required Credentials:
- API Token
- Project ID (optional)

Get token from: https://railway.app/account/tokens
```

#### Supabase
```
Required Credentials:
- Project ID
- API Key
- Service Role Key (optional, for admin operations)

Get from: Supabase Project Settings > API
```

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# API Configuration
API_BASE_URL=https://api.almonds.io

# Feature Flags
ENABLE_ANALYTICS=true
ENABLE_OFFLINE_MODE=true

# Provider API Endpoints (optional overrides)
AWS_ENDPOINT=
AZURE_ENDPOINT=
```

### Customization

#### Adding Custom Providers

1. Create a new provider service extending `BaseProviderService`:

```typescript
// src/app/core/services/providers/custom-provider.service.ts
import { Injectable } from '@angular/core';
import { BaseProviderService } from './base-provider.service';

@Injectable({
  providedIn: 'root'
})
export class CustomProviderService extends BaseProviderService {
  // Implement required methods
  initialize(config: ProviderConfig): Observable<boolean> {
    // Implementation
  }

  fetchResources(): Observable<Resource[]> {
    // Implementation
  }

  // ... other methods
}
```

2. Register in `ProviderService`:

```typescript
// Add to src/app/core/models/resource.model.ts
export enum CloudProvider {
  // ... existing providers
  CUSTOM = 'custom'
}

// Add to provider initialization
```

#### Custom Training Modules

Add training content in `src/app/core/services/training.service.ts`:

```typescript
{
  id: 'my-custom-module',
  title: 'Custom Module',
  description: 'Your description',
  difficulty: TrainingDifficulty.BEGINNER,
  estimatedMinutes: 30,
  lessons: [
    {
      id: 'lesson-1',
      title: 'First Lesson',
      content: 'Lesson content...',
      type: 'text',
      orderIndex: 1
    }
  ],
  tags: ['custom']
}
```

## Development

### Code Organization

- **Core Module**: Singleton services and shared models (imported once in AppModule)
- **Feature Modules**: Lazy-loaded feature modules for better performance
- **Shared Module**: Reusable components, directives, and pipes
- **Path Aliases**: Use `@core/`, `@shared/`, `@features/` for cleaner imports

### State Management

Uses NgRx for predictable state management:
- Actions: User interactions and events
- Reducers: State transitions
- Effects: Side effects and async operations
- Selectors: Derived state queries

### Testing

```bash
# Run unit tests
npm test

# Run e2e tests
npm run e2e

# Generate coverage report
npm run test:coverage
```

### Code Style

```bash
# Lint
npm run lint

# Format code
npm run format
```

## API Integration

### Resource Model

```typescript
interface Resource {
  id: string;
  name: string;
  type: ResourceType;          // compute, database, storage, etc.
  provider: CloudProvider;     // aws, azure, railway, etc.
  status: ResourceStatus;      // active, inactive, error, pending
  region?: string;
  tags?: Record<string, string>;
  metadata?: ResourceMetadata;
  createdAt: Date;
  updatedAt: Date;
  cost?: ResourceCost;
}
```

### Provider Service Pattern

All provider services implement the `BaseProviderService` abstract class:

```typescript
abstract class BaseProviderService {
  abstract initialize(config: ProviderConfig): Observable<boolean>;
  abstract authenticate(credentials: ProviderCredentials): Observable<boolean>;
  abstract fetchResources(): Observable<Resource[]>;
  abstract createResource(resource: Partial<Resource>): Observable<Resource>;
  abstract updateResource(id: string, updates: Partial<Resource>): Observable<Resource>;
  abstract deleteResource(id: string): Observable<boolean>;
}
```

## Roadmap

### Version 1.1
- [ ] Real-time resource updates via WebSocket
- [ ] Advanced cost analytics and forecasting
- [ ] Resource comparison tools
- [ ] Export reports (PDF, CSV)

### Version 1.2
- [ ] Team collaboration features
- [ ] Resource automation and scheduling
- [ ] Custom dashboards and widgets
- [ ] Notification system (email, push, SMS)

### Version 2.0
- [ ] AI-powered resource optimization recommendations
- [ ] Infrastructure as Code (IaC) integration
- [ ] Multi-tenancy support
- [ ] Advanced RBAC with fine-grained permissions

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow Angular style guide
- Write unit tests for new features
- Update documentation
- Ensure all tests pass
- Follow conventional commit messages

## Security

### Reporting Vulnerabilities

Please report security vulnerabilities to security@almonds.io. Do not create public issues for security problems.

### Best Practices

- Never commit credentials or API keys
- Use environment variables for sensitive data
- Enable 2FA on cloud provider accounts
- Regularly rotate access credentials
- Follow principle of least privilege

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: [https://docs.almonds.io](https://docs.almonds.io)
- **Issues**: [GitHub Issues](https://github.com/yourusername/almonds-resource-manager/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/almonds-resource-manager/discussions)
- **Email**: support@almonds.io

## Acknowledgments

- Built with [Ionic Framework](https://ionicframework.com/)
- Powered by [Angular](https://angular.io/)
- Icons by [Ionicons](https://ionic.io/ionicons)

## Team

- **Project Lead**: Your Name
- **Contributors**: [Contributors](https://github.com/yourusername/almonds-resource-manager/graphs/contributors)

---

Made with ❤️ by the Almonds team

### Integrations & API

#### Managing API Keys

1. **Create API Key**
   - Navigate to Integrations → API Keys
   - Click "Add" to create new key
   - Enter key name and description
   - Select API scopes (read:resources, write:resources, etc.)
   - Configure rate limits
   - Set optional expiration date
   - Copy the generated key (shown only once!)

2. **API Key Security**
   - Keys are shown only once after creation
   - Store keys securely in environment variables
   - Use IP whitelisting for additional security
   - Revoke compromised keys immediately
   - Set expiration dates for temporary access

3. **Monitor API Usage**
   - View total requests and bandwidth usage
   - Track error rates
   - Monitor last usage timestamp
   - Review rate limit consumption

#### Setting Up Webhooks

1. **Create Webhook**
   - Navigate to Integrations → Webhooks
   - Enter webhook name and URL
   - Select events to subscribe to:
     - resource.created/updated/deleted
     - alert.triggered
     - workflow.started/completed/failed
     - health_check.failed
     - scaling.event
     - compliance.report_generated
     - budget.threshold_exceeded
   - Configure custom headers if needed

2. **Test Webhooks**
   - Use the "Test" button to send sample payload
   - Verify webhook endpoint responds correctly
   - Check response time and status code

3. **Monitor Webhook Health**
   - View delivery statistics
   - Track success and failure rates
   - Monitor average response time
   - Review consecutive failures
   - Enable/disable webhooks as needed

#### Working with IaC Templates

1. **Browse Templates**
   - Navigate to Integrations → IaC Templates
   - Filter by type (Terraform, CloudFormation, Pulumi, Ansible)
   - View template details, variables, and outputs
   - Check deployment count and ratings

2. **Deploy from Template**
   - Select template to deploy
   - Click "Deploy" button
   - Enter deployment name
   - Provide required variable values
   - Monitor deployment progress
   - View deployment logs

3. **Create Custom Templates**
   - Create new template with your IaC code
   - Define template variables with validation rules
   - Specify template outputs
   - Add tags and category
   - Publish for team use or keep private
   - Version your templates

4. **Template Variables**
   - Define required and optional variables
   - Set default values
   - Add validation rules (min, max, allowed values, regex patterns)
   - Include descriptions for documentation

5. **Deployment Management**
   - Track all deployments
   - View deployment status and duration
   - Review deployed resources
   - Access deployment logs
   - Monitor deployment health
