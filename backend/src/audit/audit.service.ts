import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAuditLogDto, AuditAction, AuditStatus } from './dto/create-audit-log.dto';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create a new audit log entry
   */
  async log(dto: CreateAuditLogDto) {
    try {
      const auditLog = await this.prisma.auditLog.create({
        data: {
          organizationId: dto.organizationId,
          userId: dto.userId,
          action: dto.action,
          resource: dto.resource,
          resourceId: dto.resourceId,
          details: dto.details || {},
          ipAddress: dto.ipAddress,
          userAgent: dto.userAgent,
          status: dto.status || AuditStatus.SUCCESS,
        },
      });

      return auditLog;
    } catch (error) {
      // Don't throw errors for audit logging - just log them
      this.logger.error(`Failed to create audit log: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Quick helper methods for common actions
   */
  async logSuccess(
    organizationId: string,
    userId: string,
    action: AuditAction,
    details?: Record<string, any>,
    metadata?: { ipAddress?: string; userAgent?: string; resource?: string; resourceId?: string },
  ) {
    return this.log({
      organizationId,
      userId,
      action,
      status: AuditStatus.SUCCESS,
      details,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
      resource: metadata?.resource,
      resourceId: metadata?.resourceId,
    });
  }

  async logFailure(
    organizationId: string,
    userId: string | undefined,
    action: AuditAction,
    error: Error,
    metadata?: { ipAddress?: string; userAgent?: string; resource?: string; resourceId?: string },
  ) {
    return this.log({
      organizationId,
      userId,
      action,
      status: AuditStatus.FAILURE,
      details: {
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
      resource: metadata?.resource,
      resourceId: metadata?.resourceId,
    });
  }

  /**
   * Query audit logs with filters
   */
  async findAll(organizationId: string, query: QueryAuditLogsDto) {
    const where: Prisma.AuditLogWhereInput = {
      organizationId,
    };

    if (query.userId) {
      where.userId = query.userId;
    }

    if (query.action) {
      where.action = query.action;
    }

    if (query.resource) {
      where.resource = query.resource;
    }

    if (query.resourceId) {
      where.resourceId = query.resourceId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.createdAt.lte = new Date(query.endDate);
      }
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          [query.sortBy as string]: query.sortOrder,
        },
        take: query.limit || 50,
        skip: query.offset || 50,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      pagination: {
        total,
        limit: query.limit || 50,
        offset: query.offset || 0,
        hasMore: (query.offset || 0) + (query.limit || 50) < total,
      },
    };
  }

  /**
   * Get audit log by ID
   */
  async findOne(organizationId: string, id: string) {
    return this.prisma.auditLog.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Get audit statistics
   */
  async getStatistics(organizationId: string, startDate?: Date, endDate?: Date) {
    const where: Prisma.AuditLogWhereInput = {
      organizationId,
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    const [total, byAction, byUser, byStatus, recentActivity] = await Promise.all([
      // Total count
      this.prisma.auditLog.count({ where }),

      // Count by action
      this.prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: {
          action: true,
        },
        orderBy: {
          _count: {
            action: 'desc',
          },
        },
        take: 10,
      }),

      // Count by user
      this.prisma.auditLog.groupBy({
        by: ['userId'],
        where: {
          ...where,
          userId: { not: null },
        },
        _count: {
          userId: true,
        },
        orderBy: {
          _count: {
            userId: 'desc',
          },
        },
        take: 10,
      }),

      // Count by status
      this.prisma.auditLog.groupBy({
        by: ['status'],
        where,
        _count: {
          status: true,
        },
      }),

      // Recent activity (last 7 days by day)
      this.prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
        SELECT
          DATE(created_at) as date,
          COUNT(*) as count
        FROM audit_logs
        WHERE organization_id = ${organizationId}
          AND created_at >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `,
    ]);

    return {
      total,
      byAction: byAction.map((item) => ({
        action: item.action,
        count: item._count.action,
      })),
      byUser: byUser.map((item) => ({
        userId: item.userId,
        count: item._count.userId,
      })),
      byStatus: byStatus.map((item) => ({
        status: item.status,
        count: item._count.status,
      })),
      recentActivity: recentActivity.map((item) => ({
        date: item.date,
        count: Number(item.count),
      })),
    };
  }

  /**
   * Export audit logs (for compliance)
   */
  async exportLogs(organizationId: string, query: QueryAuditLogsDto) {
    const where: Prisma.AuditLogWhereInput = {
      organizationId,
    };

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.createdAt.lte = new Date(query.endDate);
      }
    }

    const logs = await this.prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return logs;
  }

  /**
   * Delete old audit logs (for data retention policies)
   */
  async deleteOldLogs(organizationId: string, olderThanDays: number) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.prisma.auditLog.deleteMany({
      where: {
        organizationId,
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    this.logger.log(`Deleted ${result.count} audit logs older than ${olderThanDays} days for org ${organizationId}`);

    return result;
  }
}
