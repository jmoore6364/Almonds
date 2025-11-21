import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto/organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createOrgDto: CreateOrganizationDto) {
    // Generate slug from name
    const slug = createOrgDto.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Create organization with user as owner
    const organization = await this.prisma.organization.create({
      data: {
        name: createOrgDto.name,
        slug,
        description: createOrgDto.description,
        members: {
          create: {
            userId,
            role: 'owner',
            joinedAt: new Date(),
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    return organization;
  }

  async findAllForUser(userId: string) {
    const memberships = await this.prisma.organizationMember.findMany({
      where: { userId },
      include: {
        organization: true,
      },
    });

    return memberships.map((m) => ({
      ...m.organization,
      role: m.role,
    }));
  }

  async findOne(id: string, userId: string) {
    await this.verifyMembership(id, userId);

    const organization = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
        _count: {
          select: {
            resources: true,
            apiKeys: true,
            webhooks: true,
          },
        },
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  async update(id: string, userId: string, updateOrgDto: UpdateOrganizationDto) {
    await this.verifyAdmin(id, userId);

    return this.prisma.organization.update({
      where: { id },
      data: updateOrgDto,
    });
  }

  async remove(id: string, userId: string) {
    await this.verifyOwner(id, userId);

    return this.prisma.organization.delete({
      where: { id },
    });
  }

  async getMembers(id: string, userId: string) {
    await this.verifyMembership(id, userId);

    return this.prisma.organizationMember.findMany({
      where: { organizationId: id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async getMemberRole(organizationId: string, userId: string): Promise<string | null> {
    const member = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });

    return member?.role || null;
  }

  // Helper methods
  private async verifyMembership(organizationId: string, userId: string) {
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

  private async verifyAdmin(organizationId: string, userId: string) {
    const member = await this.verifyMembership(organizationId, userId);

    if (!['owner', 'admin'].includes(member.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return member;
  }

  private async verifyOwner(organizationId: string, userId: string) {
    const member = await this.verifyMembership(organizationId, userId);

    if (member.role !== 'owner') {
      throw new ForbiddenException('Only organization owners can perform this action');
    }

    return member;
  }
}
