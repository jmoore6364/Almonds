# Contributing to Almonds Resource Manager

Thank you for your interest in contributing to Almonds! We appreciate your help in making this project better.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/yourusername/almonds-resource-manager/issues)
2. If not, create a new issue with:
   - Clear, descriptive title
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Environment details (OS, browser, versions)

### Suggesting Features

1. Check [Discussions](https://github.com/yourusername/almonds-resource-manager/discussions) for similar suggestions
2. Create a new discussion in the Ideas category
3. Describe the feature and its benefits
4. Provide use cases and examples

### Pull Requests

1. **Fork and Clone**
   ```bash
   git clone https://github.com/yourusername/almonds-resource-manager.git
   cd almonds-resource-manager
   ```

2. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

3. **Make Changes**
   - Follow the coding standards
   - Write/update tests
   - Update documentation

4. **Test Your Changes**
   ```bash
   npm test
   npm run lint
   ```

5. **Commit**
   ```bash
   git commit -m "feat: add amazing feature"
   ```

   Use conventional commits:
   - `feat:` New feature
   - `fix:` Bug fix
   - `docs:` Documentation changes
   - `style:` Code style changes
   - `refactor:` Code refactoring
   - `test:` Test additions/changes
   - `chore:` Build/tooling changes

6. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```
   Then create a Pull Request on GitHub

### PR Guidelines

- Link related issues
- Provide clear description of changes
- Include screenshots for UI changes
- Ensure all tests pass
- Keep PRs focused and atomic
- Update CHANGELOG.md if applicable

## Development Setup

See [README.md](README.md) for detailed setup instructions.

## Coding Standards

### TypeScript/Angular

- Use TypeScript strict mode
- Follow Angular style guide
- Use meaningful variable names
- Add JSDoc comments for public APIs
- Prefer interfaces over types
- Use RxJS operators appropriately

### Component Structure

```typescript
@Component({
  selector: 'app-example',
  templateUrl: './example.component.html',
  styleUrls: ['./example.component.scss']
})
export class ExampleComponent implements OnInit {
  // Public properties
  public title = 'Example';

  // Observable streams
  data$: Observable<Data>;

  constructor(
    private service: ExampleService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  // Public methods
  loadData() {
    this.data$ = this.service.getData();
  }

  // Private methods
  private helperMethod() {
    // Implementation
  }
}
```

### CSS/SCSS

- Use Ionic CSS utilities when possible
- Follow BEM naming convention for custom classes
- Keep selectors specific but not overly nested
- Use CSS variables for theming

### Testing

- Write unit tests for all services
- Test component logic (not implementation details)
- Aim for >80% code coverage
- Use descriptive test names

```typescript
describe('ResourceService', () => {
  it('should fetch all resources', () => {
    // Test implementation
  });

  it('should handle errors gracefully', () => {
    // Test implementation
  });
});
```

## Project Structure

```
src/app/
├── core/          # Singleton services, guards
├── features/      # Feature modules (lazy loaded)
├── shared/        # Shared components, directives, pipes
└── models/        # Data models and interfaces
```

## Adding New Cloud Providers

1. Create provider service in `src/app/core/services/providers/`
2. Extend `BaseProviderService`
3. Implement all required methods
4. Add provider to `CloudProvider` enum
5. Update `ProviderService` initialization
6. Add provider icon mapping
7. Create connection form in `ProviderConnectPage`
8. Write tests
9. Update documentation

## Questions?

- Join our [Discussions](https://github.com/yourusername/almonds-resource-manager/discussions)
- Check the [Wiki](https://github.com/yourusername/almonds-resource-manager/wiki)
- Email: dev@almonds.io

Thank you for contributing!
