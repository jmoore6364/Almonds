import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResourcesService } from './resources.service';
import { CreateResourceDto, UpdateResourceDto } from './dto/resource.dto';

@ApiTags('resources')
@Controller('resources')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ResourcesController {
  constructor(private resourcesService: ResourcesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all resources for organization' })
  @ApiQuery({ name: 'organizationId', required: true })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'provider', required: false })
  async findAll(
    @Request() req,
    @Query('organizationId') organizationId: string,
    @Query('type') type?: string,
    @Query('provider') provider?: string,
  ) {
    return this.resourcesService.findAll(organizationId, req.user.userId, {
      type,
      provider,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get resource by ID' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.resourcesService.findOne(id, req.user.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new resource' })
  async create(@Request() req, @Body() createResourceDto: CreateResourceDto) {
    return this.resourcesService.create(createResourceDto, req.user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update resource' })
  async update(
    @Param('id') id: string,
    @Request() req,
    @Body() updateResourceDto: UpdateResourceDto,
  ) {
    return this.resourcesService.update(id, updateResourceDto, req.user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete resource' })
  async remove(@Param('id') id: string, @Request() req) {
    return this.resourcesService.remove(id, req.user.userId);
  }
}
