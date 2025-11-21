import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ForbiddenException,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WebhooksService } from './webhooks.service';
import { CreateWebhookDto, UpdateWebhookDto, TestWebhookDto } from './dto/create-webhook.dto';
import { OrganizationsService } from '../organizations/organizations.service';
import { AuditLog } from '../audit/decorators/audit-log.decorator';
import { AuditLogInterceptor } from '../audit/interceptors/audit-log.interceptor';
import { AuditAction } from '../audit/dto/create-audit-log.dto';

@ApiTags('webhooks')
@Controller('api/v1/webhooks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@UseInterceptors(AuditLogInterceptor)
export class WebhooksController {
  constructor(
    private readonly webhooksService: WebhooksService,
    private readonly organizationsService: OrganizationsService,
  ) {}

  /**
   * Create a new webhook
   * Requires: Organization admin or owner
   */
  @Post()
  @ApiOperation({ summary: 'Create a new webhook' })
  @AuditLog({
    action: AuditAction.WEBHOOK_CREATE,
    resource: 'webhook',
    includeBody: true,
  })
  async create(@Query('organizationId') organizationId: string, @Body() createWebhookDto: CreateWebhookDto, @Req() req) {
    if (!organizationId) {
      throw new ForbiddenException('Organization ID is required');
    }

    // Check if user has admin access
    const member = await this.organizationsService.getMemberRole(organizationId, req.user.id);
    if (!member || !['owner', 'admin'].includes(member.role)) {
      throw new ForbiddenException('Only organization owners and admins can create webhooks');
    }

    return this.webhooksService.create(organizationId, req.user.id, createWebhookDto);
  }

  /**
   * Get all webhooks for an organization
   * Requires: Organization member
   */
  @Get()
  @ApiOperation({ summary: 'Get all webhooks' })
  async findAll(@Query('organizationId') organizationId: string, @Req() req) {
    if (!organizationId) {
      throw new ForbiddenException('Organization ID is required');
    }

    const member = await this.organizationsService.getMemberRole(organizationId, req.user.id);
    if (!member) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    return this.webhooksService.findAll(organizationId);
  }

  /**
   * Get a specific webhook
   * Requires: Organization member
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a webhook by ID' })
  async findOne(@Param('id') id: string, @Query('organizationId') organizationId: string, @Req() req) {
    if (!organizationId) {
      throw new ForbiddenException('Organization ID is required');
    }

    const member = await this.organizationsService.getMemberRole(organizationId, req.user.id);
    if (!member) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    return this.webhooksService.findOne(organizationId, id);
  }

  /**
   * Update a webhook
   * Requires: Organization admin or owner
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update a webhook' })
  @AuditLog({
    action: AuditAction.WEBHOOK_UPDATE,
    resource: 'webhook',
    resourceIdParam: 'id',
    includeBody: true,
  })
  async update(
    @Param('id') id: string,
    @Query('organizationId') organizationId: string,
    @Body() updateWebhookDto: UpdateWebhookDto,
    @Req() req,
  ) {
    if (!organizationId) {
      throw new ForbiddenException('Organization ID is required');
    }

    const member = await this.organizationsService.getMemberRole(organizationId, req.user.id);
    if (!member || !['owner', 'admin'].includes(member.role)) {
      throw new ForbiddenException('Only organization owners and admins can update webhooks');
    }

    return this.webhooksService.update(organizationId, id, updateWebhookDto);
  }

  /**
   * Delete a webhook
   * Requires: Organization admin or owner
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a webhook' })
  @AuditLog({
    action: AuditAction.WEBHOOK_DELETE,
    resource: 'webhook',
    resourceIdParam: 'id',
  })
  async remove(@Param('id') id: string, @Query('organizationId') organizationId: string, @Req() req) {
    if (!organizationId) {
      throw new ForbiddenException('Organization ID is required');
    }

    const member = await this.organizationsService.getMemberRole(organizationId, req.user.id);
    if (!member || !['owner', 'admin'].includes(member.role)) {
      throw new ForbiddenException('Only organization owners and admins can delete webhooks');
    }

    return this.webhooksService.remove(organizationId, id);
  }

  /**
   * Test a webhook
   * Requires: Organization admin or owner
   */
  @Post(':id/test')
  @ApiOperation({ summary: 'Test a webhook by sending a test payload' })
  @AuditLog({
    action: AuditAction.WEBHOOK_TEST,
    resource: 'webhook',
    resourceIdParam: 'id',
  })
  async test(
    @Param('id') id: string,
    @Query('organizationId') organizationId: string,
    @Body() testDto: TestWebhookDto,
    @Req() req,
  ) {
    if (!organizationId) {
      throw new ForbiddenException('Organization ID is required');
    }

    const member = await this.organizationsService.getMemberRole(organizationId, req.user.id);
    if (!member || !['owner', 'admin'].includes(member.role)) {
      throw new ForbiddenException('Only organization owners and admins can test webhooks');
    }

    return this.webhooksService.test(organizationId, id, testDto);
  }

  /**
   * Get webhook delivery history
   * Requires: Organization member
   */
  @Get(':id/deliveries')
  @ApiOperation({ summary: 'Get webhook delivery history' })
  async getDeliveries(
    @Param('id') id: string,
    @Query('organizationId') organizationId: string,
    @Query('limit') limit?: string,
    @Req() req?,
  ) {
    if (!organizationId) {
      throw new ForbiddenException('Organization ID is required');
    }

    const member = await this.organizationsService.getMemberRole(organizationId, req.user.id);
    if (!member) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    return this.webhooksService.getDeliveries(organizationId, id, limit ? parseInt(limit) : 50);
  }

  /**
   * Regenerate webhook secret
   * Requires: Organization admin or owner
   */
  @Post(':id/regenerate-secret')
  @ApiOperation({ summary: 'Regenerate webhook secret' })
  @AuditLog({
    action: AuditAction.WEBHOOK_UPDATE,
    resource: 'webhook',
    resourceIdParam: 'id',
  })
  async regenerateSecret(@Param('id') id: string, @Query('organizationId') organizationId: string, @Req() req) {
    if (!organizationId) {
      throw new ForbiddenException('Organization ID is required');
    }

    const member = await this.organizationsService.getMemberRole(organizationId, req.user.id);
    if (!member || !['owner', 'admin'].includes(member.role)) {
      throw new ForbiddenException('Only organization owners and admins can regenerate webhook secrets');
    }

    return this.webhooksService.regenerateSecret(organizationId, id);
  }
}
