import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProvidersService } from './providers.service';
import { CreateProviderDto, UpdateProviderDto } from './dto/provider.dto';

@ApiTags('providers')
@Controller('providers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProvidersController {
  constructor(private providersService: ProvidersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all cloud providers for organization' })
  @ApiQuery({ name: 'organizationId', required: true })
  async findAll(@Request() req, @Query('organizationId') organizationId: string) {
    return this.providersService.findAll(organizationId, req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get cloud provider by ID' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.providersService.findOne(id, req.user.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Connect a new cloud provider' })
  async create(@Request() req, @Body() createProviderDto: CreateProviderDto) {
    return this.providersService.create(createProviderDto, req.user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update cloud provider' })
  async update(
    @Param('id') id: string,
    @Request() req,
    @Body() updateProviderDto: UpdateProviderDto,
  ) {
    return this.providersService.update(id, updateProviderDto, req.user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Disconnect cloud provider' })
  async remove(@Param('id') id: string, @Request() req) {
    return this.providersService.remove(id, req.user.userId);
  }

  @Post(':id/sync')
  @ApiOperation({ summary: 'Sync resources from cloud provider' })
  async sync(@Param('id') id: string, @Request() req) {
    return this.providersService.syncResources(id, req.user.userId);
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Test cloud provider connection' })
  async testConnection(@Param('id') id: string, @Request() req) {
    return this.providersService.testConnection(id, req.user.userId);
  }
}
