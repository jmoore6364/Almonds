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

### Security & Authentication
- Secure credential storage with encryption
- Role-based access control (Admin, Developer, Viewer, Trainee)
- OAuth integration support
- Session management

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
│   │   │   └── training.model.ts
│   │   └── services/             # Business logic services
│   │       ├── resource.service.ts
│   │       ├── provider.service.ts
│   │       ├── auth.service.ts
│   │       ├── training.service.ts
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
