import { CloudProvider } from './resource.model';

export enum ProviderConnectionStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
  CONFIGURING = 'configuring'
}

export interface ProviderCredentials {
  apiKey?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  clientId?: string;
  clientSecret?: string;
  tenantId?: string;
  projectId?: string;
  token?: string;
  [key: string]: any;
}

export interface ProviderConfig {
  id: string;
  organizationId: string;
  provider: CloudProvider;
  name: string;
  displayName: string;
  status: ProviderConnectionStatus;
  credentials?: ProviderCredentials;
  region?: string;
  endpoint?: string;
  connectedAt?: Date;
  lastSyncedAt?: Date;
  connectedBy?: string;
  metadata?: Record<string, any>;
}

export interface ProviderStats {
  totalResources: number;
  activeResources: number;
  totalCost: number;
  currency: string;
}
