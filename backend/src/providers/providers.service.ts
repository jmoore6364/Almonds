import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProviderDto, UpdateProviderDto } from './dto/provider.dto';
import { AWSService } from './integrations/aws.service';
import { AzureService } from './integrations/azure.service';

@Injectable()
export class ProvidersService {
  private readonly logger = new Logger(ProvidersService.name);

  constructor(
    private prisma: PrismaService,
    private awsService: AWSService,
    private azureService: AzureService,
  ) {}

  async findAll(organizationId: string, userId: string) {
    await this.verifyOrganizationAccess(organizationId, userId);

    return this.prisma.cloudProvider.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        provider: true,
        status: true,
        region: true,
        lastSynced: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            resources: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, userId: string) {
    const provider = await this.prisma.cloudProvider.findUnique({
      where: { id },
      include: {
        organization: true,
        _count: {
          select: {
            resources: true,
          },
        },
      },
    });

    if (!provider) {
      throw new NotFoundException('Cloud provider not found');
    }

    await this.verifyOrganizationAccess(provider.organizationId, userId);

    // Don't expose credentials
    const { credentials, ...safeProvider } = provider;

    return safeProvider;
  }

  async create(createProviderDto: CreateProviderDto, userId: string) {
    await this.verifyOrganizationAccess(createProviderDto.organizationId, userId);

    // TODO: Encrypt credentials before storing
    // For now, just store as-is (should implement encryption)

    return this.prisma.cloudProvider.create({
      data: {
        ...createProviderDto,
        createdBy: userId,
      },
      select: {
        id: true,
        name: true,
        provider: true,
        status: true,
        region: true,
        createdAt: true,
      },
    });
  }

  async update(id: string, updateProviderDto: UpdateProviderDto, userId: string) {
    await this.findOne(id, userId);

    return this.prisma.cloudProvider.update({
      where: { id },
      data: updateProviderDto,
      select: {
        id: true,
        name: true,
        provider: true,
        status: true,
        region: true,
        updatedAt: true,
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);

    return this.prisma.cloudProvider.delete({
      where: { id },
    });
  }

  async syncResources(id: string, userId: string) {
    // Get full provider with credentials
    const provider = await this.prisma.cloudProvider.findUnique({
      where: { id },
      include: { organization: true },
    });

    if (!provider) {
      throw new NotFoundException('Cloud provider not found');
    }

    await this.verifyOrganizationAccess(provider.organizationId, userId);

    try {
      let resources = [];

      // Sync based on provider type
      switch (provider.provider.toLowerCase()) {
        case 'aws':
          resources = await this.syncAWSResources(provider);
          break;
        case 'azure':
          resources = await this.syncAzureResources(provider);
          break;
        default:
          this.logger.warn(`Unsupported provider type: ${provider.provider}`);
          throw new Error(`Unsupported provider type: ${provider.provider}`);
      }

      // Update lastSynced timestamp
      await this.prisma.cloudProvider.update({
        where: { id },
        data: {
          lastSynced: new Date(),
          status: 'connected',
        },
      });

      this.logger.log(
        `Synced ${resources.length} resources for provider ${provider.name} (${provider.provider})`,
      );

      return {
        message: 'Resource sync completed',
        providerId: id,
        provider: provider.provider,
        resourceCount: resources.length,
        resources,
      };
    } catch (error) {
      this.logger.error(`Failed to sync resources for provider ${id}`, error);

      // Update provider status to error
      await this.prisma.cloudProvider.update({
        where: { id },
        data: {
          status: 'error',
        },
      });

      throw new Error(`Failed to sync resources: ${error.message}`);
    }
  }

  /**
   * Sync AWS resources
   */
  private async syncAWSResources(provider: any) {
    const credentials = JSON.parse(provider.credentials);
    const awsCredentials = {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      region: provider.region || credentials.region || 'us-east-1',
    };

    // Get all AWS resources
    const awsResources = await this.awsService.getAllResources(awsCredentials);

    // Sync to database
    const syncedResources = [];
    for (const resource of awsResources) {
      const synced = await this.upsertResource(provider, resource);
      syncedResources.push(synced);
    }

    return syncedResources;
  }

  /**
   * Sync Azure resources
   */
  private async syncAzureResources(provider: any) {
    const credentials = JSON.parse(provider.credentials);
    const azureCredentials = {
      clientId: credentials.clientId,
      clientSecret: credentials.clientSecret,
      tenantId: credentials.tenantId,
      subscriptionId: credentials.subscriptionId,
    };

    // Get all Azure resources
    const azureResources = await this.azureService.getAllResources(azureCredentials);

    // Sync to database
    const syncedResources = [];
    for (const resource of azureResources) {
      const synced = await this.upsertResource(provider, resource);
      syncedResources.push(synced);
    }

    return syncedResources;
  }

  /**
   * Upsert a resource into the database
   */
  private async upsertResource(provider: any, resource: any) {
    return this.prisma.resource.upsert({
      where: {
        providerId_externalId: {
          providerId: provider.id,
          externalId: resource.id,
        },
      },
      update: {
        name: resource.name,
        status: resource.status,
        tags: resource.tags,
        metadata: resource.metadata,
        updatedAt: new Date(),
      },
      create: {
        organizationId: provider.organizationId,
        providerId: provider.id,
        externalId: resource.id,
        name: resource.name,
        type: resource.type,
        status: resource.status,
        region: resource.region,
        tags: resource.tags,
        metadata: resource.metadata,
      },
    });
  }

  /**
   * Test provider connection
   */
  async testConnection(id: string, userId: string) {
    const provider = await this.prisma.cloudProvider.findUnique({
      where: { id },
    });

    if (!provider) {
      throw new NotFoundException('Cloud provider not found');
    }

    await this.verifyOrganizationAccess(provider.organizationId, userId);

    try {
      const credentials = JSON.parse(provider.credentials);

      switch (provider.provider.toLowerCase()) {
        case 'aws':
          await this.awsService.testConnection({
            accessKeyId: credentials.accessKeyId,
            secretAccessKey: credentials.secretAccessKey,
            region: provider.region || credentials.region || 'us-east-1',
          });
          break;
        case 'azure':
          await this.azureService.testConnection({
            clientId: credentials.clientId,
            clientSecret: credentials.clientSecret,
            tenantId: credentials.tenantId,
            subscriptionId: credentials.subscriptionId,
          });
          break;
        default:
          throw new Error(`Unsupported provider type: ${provider.provider}`);
      }

      // Update provider status to connected
      await this.prisma.cloudProvider.update({
        where: { id },
        data: {
          status: 'connected',
        },
      });

      return {
        success: true,
        message: 'Connection test successful',
      };
    } catch (error) {
      this.logger.error(`Connection test failed for provider ${id}`, error);

      // Update provider status to error
      await this.prisma.cloudProvider.update({
        where: { id },
        data: {
          status: 'error',
        },
      });

      throw new Error(`Connection test failed: ${error.message}`);
    }
  }

  private async verifyOrganizationAccess(organizationId: string, userId: string) {
    const member = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });

    if (!member) {
      throw new ForbiddenException('Not a member of this organization');
    }

    return member;
  }
}
