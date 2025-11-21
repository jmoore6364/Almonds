import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
  NotFoundException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuditService } from './audit.service';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationsService } from '../organizations/organizations.service';

@Controller('api/v1/audit-logs')
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(
    private readonly auditService: AuditService,
    private readonly organizationsService: OrganizationsService,
  ) {}

  /**
   * Get audit logs for an organization
   * Requires: Organization member (viewer role or higher)
   */
  @Get()
  async findAll(@Query('organizationId') organizationId: string, @Query() query: QueryAuditLogsDto, @Req() req) {
    if (!organizationId) {
      throw new ForbiddenException('Organization ID is required');
    }

    // Check if user is a member of the organization
    const member = await this.organizationsService.getMemberRole(organizationId, req.user.id);
    if (!member) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    return this.auditService.findAll(organizationId, query);
  }

  /**
   * Get a specific audit log entry
   * Requires: Organization member
   */
  @Get(':id')
  async findOne(@Param('id') id: string, @Query('organizationId') organizationId: string, @Req() req) {
    if (!organizationId) {
      throw new ForbiddenException('Organization ID is required');
    }

    // Check if user is a member of the organization
    const member = await this.organizationsService.getMemberRole(organizationId, req.user.id);
    if (!member) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    const auditLog = await this.auditService.findOne(organizationId, id);
    if (!auditLog) {
      throw new NotFoundException('Audit log not found');
    }

    return auditLog;
  }

  /**
   * Get audit log statistics
   * Requires: Organization admin or owner
   */
  @Get('statistics/summary')
  async getStatistics(
    @Query('organizationId') organizationId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Req() req?: any,
  ) {
    if (!organizationId) {
      throw new ForbiddenException('Organization ID is required');
    }

    // Check if user has admin access
    const member = await this.organizationsService.getMemberRole(organizationId, req.user.id);
    if (!member || !['owner', 'admin'].includes(member.role)) {
      throw new ForbiddenException('Only organization owners and admins can view audit statistics');
    }

    return this.auditService.getStatistics(
      organizationId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  /**
   * Export audit logs (CSV/JSON)
   * Requires: Organization admin or owner
   */
  @Get('export/logs')
  @HttpCode(HttpStatus.OK)
  async exportLogs(@Query('organizationId') organizationId: string, @Query() query: QueryAuditLogsDto, @Req() req) {
    if (!organizationId) {
      throw new ForbiddenException('Organization ID is required');
    }

    // Check if user has admin access
    const member = await this.organizationsService.getMemberRole(organizationId, req.user.id);
    if (!member || !['owner', 'admin'].includes(member.role)) {
      throw new ForbiddenException('Only organization owners and admins can export audit logs');
    }

    const logs = await this.auditService.exportLogs(organizationId, query);

    return {
      organizationId,
      exportedAt: new Date().toISOString(),
      totalRecords: logs.length,
      logs,
    };
  }
}
