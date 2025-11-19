import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProviderDto, UpdateProviderDto } from './dto/provider.dto';

@Injectable()
export class ProvidersService {
  constructor(private prisma: PrismaService) {}

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
    const provider = await this.findOne(id, userId);

    // TODO: Implement actual cloud provider sync logic
    // For now, just update lastSynced timestamp

    await this.prisma.cloudProvider.update({
      where: { id },
      data: {
        lastSynced: new Date(),
      },
    });

    return {
      message: 'Resource sync initiated',
      providerId: id,
      provider: provider.provider,
    };
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
