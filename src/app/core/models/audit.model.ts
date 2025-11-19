export interface AuditLog {
  id: string;
  organizationId: string;
  timestamp: Date;
  userId: string;
  userName: string;
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  resourceName?: string;
  details: AuditDetails;
  ipAddress?: string;
  userAgent?: string;
  status: AuditStatus;
  metadata?: Record<string, any>;
}

export enum AuditAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
  ACCESS_DENIED = 'access_denied',
  PERMISSION_CHANGED = 'permission_changed',
  CONFIGURATION_CHANGED = 'configuration_changed',
  BACKUP_CREATED = 'backup_created',
  BACKUP_RESTORED = 'backup_restored',
  WORKFLOW_EXECUTED = 'workflow_executed',
  ALERT_TRIGGERED = 'alert_triggered',
  EXPORT_DATA = 'export_data',
  IMPORT_DATA = 'import_data'
}

export interface AuditDetails {
  before?: any;
  after?: any;
  changes?: Record<string, { from: any; to: any }>;
  reason?: string;
  additional?: Record<string, any>;
}

export enum AuditStatus {
  SUCCESS = 'success',
  FAILURE = 'failure',
  PARTIAL = 'partial',
  PENDING = 'pending'
}

export interface ComplianceReport {
  id: string;
  organizationId: string;
  framework: ComplianceFramework;
  period: ReportPeriod;
  generatedAt: Date;
  generatedBy: string;
  status: ComplianceStatus;
  score: number;
  findings: ComplianceFinding[];
  recommendations: ComplianceRecommendation[];
  summary: ComplianceSummary;
}

export enum ComplianceFramework {
  SOC2 = 'soc2',
  HIPAA = 'hipaa',
  GDPR = 'gdpr',
  ISO27001 = 'iso27001',
  PCI_DSS = 'pci_dss',
  CUSTOM = 'custom'
}

export interface ReportPeriod {
  startDate: Date;
  endDate: Date;
  label: string;
}

export enum ComplianceStatus {
  COMPLIANT = 'compliant',
  NON_COMPLIANT = 'non_compliant',
  PARTIALLY_COMPLIANT = 'partially_compliant',
  NOT_APPLICABLE = 'not_applicable',
  IN_PROGRESS = 'in_progress'
}

export interface ComplianceFinding {
  id: string;
  control: string;
  requirement: string;
  status: ComplianceStatus;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: string[];
  remediation?: string;
  dueDate?: Date;
  assignee?: string;
}

export interface ComplianceRecommendation {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  impact: string;
  steps: string[];
}

export interface ComplianceSummary {
  totalControls: number;
  compliantControls: number;
  nonCompliantControls: number;
  partiallyCompliantControls: number;
  notApplicableControls: number;
  criticalFindings: number;
  highFindings: number;
  mediumFindings: number;
  lowFindings: number;
}

export interface AuditSearchFilter {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  action?: AuditAction;
  resourceType?: string;
  status?: AuditStatus;
  searchTerm?: string;
}

export interface ComplianceControl {
  id: string;
  framework: ComplianceFramework;
  controlId: string;
  title: string;
  description: string;
  category: string;
  status: ComplianceStatus;
  lastAssessed?: Date;
  nextAssessment?: Date;
  owner?: string;
  evidence: string[];
  notes?: string;
}

export interface DataRetentionPolicy {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  dataType: string;
  retentionPeriodDays: number;
  enabled: boolean;
  lastApplied?: Date;
  itemsAffected: number;
  createdAt: Date;
}

export interface ExportRequest {
  id: string;
  organizationId: string;
  requestedBy: string;
  requestedAt: Date;
  dataType: string;
  format: 'csv' | 'json' | 'pdf' | 'xml';
  filters?: Record<string, any>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  expiresAt?: Date;
  fileSize?: number;
}
