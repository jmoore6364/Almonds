import { SetMetadata } from '@nestjs/common';
import { AuditAction } from '../dto/create-audit-log.dto';

export const AUDIT_LOG_KEY = 'audit_log';

export interface AuditLogMetadata {
  action: AuditAction;
  resource?: string;
  resourceIdParam?: string; // Name of the parameter that contains the resource ID
  includeBody?: boolean; // Include request body in details
  includeParams?: boolean; // Include URL params in details
}

/**
 * Decorator to automatically log audit trails for controller methods
 *
 * @example
 * @AuditLog({
 *   action: AuditAction.RESOURCE_CREATE,
 *   resource: 'resource',
 *   resourceIdParam: 'id',
 *   includeBody: true
 * })
 * @Post()
 * async create(@Body() dto: CreateResourceDto) {
 *   // Method implementation
 * }
 */
export const AuditLog = (metadata: AuditLogMetadata) => SetMetadata(AUDIT_LOG_KEY, metadata);
