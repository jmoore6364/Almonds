export enum ResourceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
  PENDING = 'pending',
  UNKNOWN = 'unknown'
}

export enum ResourceType {
  COMPUTE = 'compute',
  DATABASE = 'database',
  STORAGE = 'storage',
  NETWORK = 'network',
  CONTAINER = 'container',
  FUNCTION = 'function',
  OTHER = 'other'
}

export enum CloudProvider {
  AWS = 'aws',
  AZURE = 'azure',
  RAILWAY = 'railway',
  SUPABASE = 'supabase',
  GCP = 'gcp',
  VERCEL = 'vercel',
  NETLIFY = 'netlify',
  CUSTOM = 'custom'
}

export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  provider: CloudProvider;
  status: ResourceStatus;
  region?: string;
  tags?: Record<string, string>;
  metadata?: ResourceMetadata;
  createdAt: Date;
  updatedAt: Date;
  cost?: ResourceCost;
}

export interface ResourceMetadata {
  size?: string;
  instance_type?: string;
  url?: string;
  connection_string?: string;
  [key: string]: any;
}

export interface ResourceCost {
  amount: number;
  currency: string;
  period: 'hourly' | 'daily' | 'monthly' | 'yearly';
}

export interface ResourceGroup {
  id: string;
  name: string;
  description?: string;
  resources: Resource[];
  provider: CloudProvider;
  tags?: Record<string, string>;
}
