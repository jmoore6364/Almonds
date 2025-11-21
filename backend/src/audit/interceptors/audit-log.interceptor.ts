import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AuditService } from '../audit.service';
import { AUDIT_LOG_KEY, AuditLogMetadata } from '../decorators/audit-log.decorator';
import { AuditStatus } from '../dto/create-audit-log.dto';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const metadata = this.reflector.get<AuditLogMetadata>(AUDIT_LOG_KEY, context.getHandler());

    if (!metadata) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const organizationId = request.body?.organizationId || request.query?.organizationId || request.params?.organizationId;

    // Skip if no organization ID or user
    if (!organizationId || !user) {
      return next.handle();
    }

    // Extract details
    const details: any = {};

    if (metadata.includeBody && request.body) {
      details.body = this.sanitizeData(request.body);
    }

    if (metadata.includeParams && request.params) {
      details.params = request.params;
    }

    // Extract resource ID if specified
    const resourceId = metadata.resourceIdParam ? request.params[metadata.resourceIdParam] : undefined;

    // Get client metadata
    const ipAddress = request.ip || request.connection.remoteAddress;
    const userAgent = request.headers['user-agent'];

    return next.handle().pipe(
      tap(() => {
        // Log successful action
        this.auditService
          .log({
            organizationId,
            userId: user.id,
            action: metadata.action,
            resource: metadata.resource,
            resourceId,
            details,
            ipAddress,
            userAgent,
            status: AuditStatus.SUCCESS,
          })
          .catch((error) => {
            this.logger.error(`Failed to log audit trail: ${error.message}`);
          });
      }),
      catchError((error) => {
        // Log failed action
        this.auditService
          .log({
            organizationId,
            userId: user.id,
            action: metadata.action,
            resource: metadata.resource,
            resourceId,
            details: {
              ...details,
              error: error.message,
            },
            ipAddress,
            userAgent,
            status: AuditStatus.FAILURE,
          })
          .catch((auditError) => {
            this.logger.error(`Failed to log audit trail: ${auditError.message}`);
          });

        return throwError(() => error);
      }),
    );
  }

  /**
   * Remove sensitive data from logged information
   */
  private sanitizeData(data: any): any {
    const sensitiveFields = ['password', 'passwordHash', 'secret', 'token', 'credentials', 'apiKey', 'privateKey'];

    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sanitized = { ...data };

    for (const key of Object.keys(sanitized)) {
      if (sensitiveFields.some((field) => key.toLowerCase().includes(field.toLowerCase()))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = this.sanitizeData(sanitized[key]);
      }
    }

    return sanitized;
  }
}
