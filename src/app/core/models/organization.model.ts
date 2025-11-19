export enum OrganizationPlan {
  FREE = 'free',
  STARTER = 'starter',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise'
}

export enum OrganizationStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  TRIAL = 'trial',
  INACTIVE = 'inactive'
}

export enum MemberRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  DEVELOPER = 'developer',
  VIEWER = 'viewer',
  BILLING = 'billing'
}

export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  EXPIRED = 'expired'
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  plan: OrganizationPlan;
  status: OrganizationStatus;
  logo?: string;
  website?: string;
  settings: OrganizationSettings;
  billing?: BillingInfo;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  memberCount: number;
  resourceCount: number;
}

export interface OrganizationSettings {
  defaultRegion?: string;
  allowedDomains?: string[];
  requireMFA: boolean;
  allowPublicResources: boolean;
  retentionDays: number;
  notificationPreferences: NotificationPreferences;
  features: FeatureFlags;
}

export interface NotificationPreferences {
  resourceAlerts: boolean;
  costAlerts: boolean;
  securityAlerts: boolean;
  weeklyReports: boolean;
  email: boolean;
  slack?: string;
  webhook?: string;
}

export interface FeatureFlags {
  aiRecommendations: boolean;
  advancedAnalytics: boolean;
  customIntegrations: boolean;
  apiAccess: boolean;
  sso: boolean;
}

export interface BillingInfo {
  customerId?: string;
  subscriptionId?: string;
  paymentMethod?: string;
  billingEmail: string;
  billingAddress?: Address;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  monthlySpend: number;
  currency: string;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  email: string;
  name: string;
  role: MemberRole;
  avatar?: string;
  joinedAt: Date;
  lastActiveAt?: Date;
  invitedBy?: string;
  permissions?: string[];
}

export interface OrganizationInvitation {
  id: string;
  organizationId: string;
  email: string;
  role: MemberRole;
  status: InvitationStatus;
  invitedBy: string;
  invitedByName: string;
  createdAt: Date;
  expiresAt: Date;
  acceptedAt?: Date;
  token: string;
}

export interface OrganizationStats {
  totalMembers: number;
  totalResources: number;
  activeResources: number;
  totalCost: number;
  costByProvider: { [provider: string]: number };
  resourcesByType: { [type: string]: number };
  monthlyGrowth: number;
}

export interface CreateOrganizationDto {
  name: string;
  slug: string;
  description?: string;
  plan?: OrganizationPlan;
}

export interface UpdateOrganizationDto {
  name?: string;
  description?: string;
  logo?: string;
  website?: string;
  settings?: Partial<OrganizationSettings>;
}

export interface InviteMemberDto {
  email: string;
  role: MemberRole;
  message?: string;
}

export interface UpdateMemberRoleDto {
  role: MemberRole;
  permissions?: string[];
}
