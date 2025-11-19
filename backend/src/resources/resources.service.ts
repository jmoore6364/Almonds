import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateResourceDto, UpdateResourceDto } from './dto/resource.dto';

@Injectable()
export class ResourcesService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    organizationId: string,
    userId: string,
    filters?: { type?: string; provider?: string },
  ) {
    await this.verifyOrganizationAccess(organizationId, userId);

    const where: any = { organizationId };

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.provider) {
      where.provider = filters.provider;
    }

    return this.prisma.resource.findMany({
      where,
      include: {
        cloudProvider: {
          select: {
            id: true,
            name: true,
            provider: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, userId: string) {
    const resource = await this.prisma.resource.findUnique({
      where: { id },
      include: {
        cloudProvider: true,
        organization: true,
      },
    });

    if (!resource) {
      throw new NotFoundException('Resource not found');
    }

    await this.verifyOrganizationAccess(resource.organizationId, userId);

    return resource;
  }

  async create(createResourceDto: CreateResourceDto, userId: string) {
    await this.verifyOrganizationAccess(createResourceDto.organizationId, userId);

    return this.prisma.resource.create({
      data: {
        ...createResourceDto,
        createdBy: userId,
      },
      include: {
        cloudProvider: true,
      },
    });
  }

  async update(id: string, updateResourceDto: UpdateResourceDto, userId: string) {
    const resource = await this.findOne(id, userId);

    return this.prisma.resource.update({
      where: { id },
      data: updateResourceDto,
      include: {
        cloudProvider: true,
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);

    return this.prisma.resource.delete({
      where: { id },
    });
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
