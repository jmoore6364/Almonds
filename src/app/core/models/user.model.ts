import { MemberRole } from './organization.model';

export enum UserRole {
  ADMIN = 'admin',
  DEVELOPER = 'developer',
  VIEWER = 'viewer',
  TRAINEE = 'trainee'
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
  lastLoginAt?: Date;
  preferences?: UserPreferences;
  // Multi-tenancy fields
  organizations: UserOrganization[];
  currentOrganizationId?: string;
}

export interface UserOrganization {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  role: MemberRole;
  joinedAt: Date;
  isDefault: boolean;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  defaultProvider?: string;
  defaultOrganization?: string;
  notifications: {
    email: boolean;
    push: boolean;
    resourceAlerts: boolean;
  };
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token?: string;
  currentOrganization?: {
    id: string;
    name: string;
    slug: string;
    role: MemberRole;
  };
}
