import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto/organization.dto';
import { AuditLog } from '../audit/decorators/audit-log.decorator';
import { AuditLogInterceptor } from '../audit/interceptors/audit-log.interceptor';
import { AuditAction } from '../audit/dto/create-audit-log.dto';

@ApiTags('organizations')
@Controller('organizations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@UseInterceptors(AuditLogInterceptor)
export class OrganizationsController {
  constructor(private organizationsService: OrganizationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new organization' })
  @AuditLog({
    action: AuditAction.ORG_CREATE,
    resource: 'organization',
    includeBody: true,
  })
  async create(@Request() req, @Body() createOrgDto: CreateOrganizationDto) {
    return this.organizationsService.create(req.user.userId, createOrgDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all organizations for current user' })
  async findAll(@Request() req) {
    return this.organizationsService.findAllForUser(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get organization by ID' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.organizationsService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update organization' })
  @AuditLog({
    action: AuditAction.ORG_UPDATE,
    resource: 'organization',
    resourceIdParam: 'id',
    includeBody: true,
  })
  async update(
    @Param('id') id: string,
    @Request() req,
    @Body() updateOrgDto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.update(id, req.user.userId, updateOrgDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete organization' })
  @AuditLog({
    action: AuditAction.ORG_DELETE,
    resource: 'organization',
    resourceIdParam: 'id',
  })
  async remove(@Param('id') id: string, @Request() req) {
    return this.organizationsService.remove(id, req.user.userId);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Get organization members' })
  async getMembers(@Param('id') id: string, @Request() req) {
    return this.organizationsService.getMembers(id, req.user.userId);
  }
}
