import { Observable } from 'rxjs';
import { Resource } from '../../models/resource.model';
import { ProviderConfig, ProviderCredentials } from '../../models/provider.model';

/**
 * Abstract base class for cloud provider integrations
 */
export abstract class BaseProviderService {
  protected config?: ProviderConfig;

  /**
   * Initialize provider with configuration
   */
  abstract initialize(config: ProviderConfig): Observable<boolean>;

  /**
   * Test connection to provider
   */
  abstract testConnection(): Observable<boolean>;

  /**
   * Authenticate with provider
   */
  abstract authenticate(credentials: ProviderCredentials): Observable<boolean>;

  /**
   * Fetch all resources from provider
   */
  abstract fetchResources(): Observable<Resource[]>;

  /**
   * Fetch specific resource by ID
   */
  abstract fetchResourceById(id: string): Observable<Resource | null>;

  /**
   * Create a new resource
   */
  abstract createResource(resource: Partial<Resource>): Observable<Resource>;

  /**
   * Update existing resource
   */
  abstract updateResource(id: string, updates: Partial<Resource>): Observable<Resource>;

  /**
   * Delete resource
   */
  abstract deleteResource(id: string): Observable<boolean>;

  /**
   * Get resource metrics/monitoring data
   */
  abstract getResourceMetrics(id: string): Observable<any>;

  /**
   * Sync resources from provider
   */
  sync(): Observable<Resource[]> {
    return this.fetchResources();
  }
}
