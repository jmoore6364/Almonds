import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto/organization.dto';

@ApiTags('organizations')
@Controller('organizations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrganizationsController {
  constructor(private organizationsService: OrganizationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new organization' })
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
  async update(
    @Param('id') id: string,
    @Request() req,
    @Body() updateOrgDto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.update(id, req.user.userId, updateOrgDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete organization' })
  async remove(@Param('id') id: string, @Request() req) {
    return this.organizationsService.remove(id, req.user.userId);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Get organization members' })
  async getMembers(@Param('id') id: string, @Request() req) {
    return this.organizationsService.getMembers(id, req.user.userId);
  }
}
