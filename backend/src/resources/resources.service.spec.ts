import { Test, TestingModule } from '@nestjs/testing';
import { ResourcesService } from './resources.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('ResourcesService', () => {
  let service: ResourcesService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    resource: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    organizationMember: {
      findUnique: jest.fn(),
    },
  };

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
  };

  const mockOrganization = {
    id: 'org-123',
    name: 'Test Organization',
    slug: 'test-organization',
  };

  const mockMember = {
    id: 'member-123',
    organizationId: 'org-123',
    userId: 'user-123',
    role: 'member',
    joinedAt: new Date(),
  };

  const mockCloudProvider = {
    id: 'provider-123',
    organizationId: 'org-123',
    name: 'AWS Production',
    provider: 'aws',
    status: 'connected',
  };

  const mockResource = {
    id: 'resource-123',
    organizationId: 'org-123',
    cloudProviderId: 'provider-123',
    name: 'EC2 Instance',
    type: 'compute',
    provider: 'aws',
    resourceId: 'i-1234567890abcdef0',
    region: 'us-east-1',
    status: 'running',
    metadata: {
      instanceType: 't3.micro',
      platform: 'linux',
    },
    cost: 0.0104,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-123',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResourcesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ResourcesService>(ResourcesService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all resources for organization when user is member', async () => {
      const resources = [
        { ...mockResource, cloudProvider: mockCloudProvider },
        {
          ...mockResource,
          id: 'resource-456',
          name: 'S3 Bucket',
          type: 'storage',
        },
      ];

      mockPrismaService.organizationMember.findUnique.mockResolvedValue(mockMember);
      mockPrismaService.resource.findMany.mockResolvedValue(resources);

      const result = await service.findAll(mockOrganization.id, mockUser.id);

      expect(result).toEqual(resources);
      expect(mockPrismaService.resource.findMany).toHaveBeenCalledWith({
        where: { organizationId: mockOrganization.id },
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
    });

    it('should filter resources by type when provided', async () => {
      mockPrismaService.organizationMember.findUnique.mockResolvedValue(mockMember);
      mockPrismaService.resource.findMany.mockResolvedValue([mockResource]);

      await service.findAll(mockOrganization.id, mockUser.id, { type: 'compute' });

      expect(mockPrismaService.resource.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            organizationId: mockOrganization.id,
            type: 'compute',
          },
        }),
      );
    });

    it('should filter resources by provider when provided', async () => {
      mockPrismaService.organizationMember.findUnique.mockResolvedValue(mockMember);
      mockPrismaService.resource.findMany.mockResolvedValue([mockResource]);

      await service.findAll(mockOrganization.id, mockUser.id, { provider: 'aws' });

      expect(mockPrismaService.resource.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            organizationId: mockOrganization.id,
            provider: 'aws',
          },
        }),
      );
    });

    it('should filter resources by both type and provider', async () => {
      mockPrismaService.organizationMember.findUnique.mockResolvedValue(mockMember);
      mockPrismaService.resource.findMany.mockResolvedValue([mockResource]);

      await service.findAll(mockOrganization.id, mockUser.id, {
        type: 'compute',
        provider: 'aws',
      });

      expect(mockPrismaService.resource.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            organizationId: mockOrganization.id,
            type: 'compute',
            provider: 'aws',
          },
        }),
      );
    });

    it('should throw ForbiddenException if user is not a member', async () => {
      mockPrismaService.organizationMember.findUnique.mockResolvedValue(null);

      await expect(
        service.findAll(mockOrganization.id, mockUser.id),
      ).rejects.toThrow(ForbiddenException);
      expect(mockPrismaService.resource.findMany).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return resource when it exists and user has access', async () => {
      const resourceWithRelations = {
        ...mockResource,
        cloudProvider: mockCloudProvider,
        organization: mockOrganization,
      };

      mockPrismaService.resource.findUnique.mockResolvedValue(resourceWithRelations);
      mockPrismaService.organizationMember.findUnique.mockResolvedValue(mockMember);

      const result = await service.findOne(mockResource.id, mockUser.id);

      expect(result).toEqual(resourceWithRelations);
      expect(mockPrismaService.resource.findUnique).toHaveBeenCalledWith({
        where: { id: mockResource.id },
        include: {
          cloudProvider: true,
          organization: true,
        },
      });
    });

    it('should throw NotFoundException if resource does not exist', async () => {
      mockPrismaService.resource.findUnique.mockResolvedValue(null);

      await expect(
        service.findOne('non-existent-id', mockUser.id),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not a member of resource organization', async () => {
      mockPrismaService.resource.findUnique.mockResolvedValue({
        ...mockResource,
        cloudProvider: mockCloudProvider,
        organization: mockOrganization,
      });
      mockPrismaService.organizationMember.findUnique.mockResolvedValue(null);

      await expect(
        service.findOne(mockResource.id, mockUser.id),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('create', () => {
    it('should create resource when user has access to organization', async () => {
      const createDto = {
        organizationId: mockOrganization.id,
        cloudProviderId: mockCloudProvider.id,
        name: 'New EC2 Instance',
        type: 'compute',
        provider: 'aws',
        resourceId: 'i-newinstance',
        region: 'us-west-2',
        status: 'running',
        metadata: { instanceType: 't3.small' },
        cost: 0.0208,
      };

      const createdResource = {
        ...createDto,
        id: 'resource-new',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: mockUser.id,
        cloudProvider: mockCloudProvider,
      };

      mockPrismaService.organizationMember.findUnique.mockResolvedValue(mockMember);
      mockPrismaService.resource.create.mockResolvedValue(createdResource);

      const result = await service.create(createDto, mockUser.id);

      expect(result).toEqual(createdResource);
      expect(mockPrismaService.resource.create).toHaveBeenCalledWith({
        data: {
          ...createDto,
          createdBy: mockUser.id,
        },
        include: {
          cloudProvider: true,
        },
      });
    });

    it('should throw ForbiddenException if user is not a member of organization', async () => {
      const createDto = {
        organizationId: mockOrganization.id,
        cloudProviderId: mockCloudProvider.id,
        name: 'New Resource',
        type: 'compute',
        provider: 'aws',
        resourceId: 'res-123',
        region: 'us-east-1',
        status: 'running',
      };

      mockPrismaService.organizationMember.findUnique.mockResolvedValue(null);

      await expect(
        service.create(createDto, mockUser.id),
      ).rejects.toThrow(ForbiddenException);
      expect(mockPrismaService.resource.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update resource when user has access', async () => {
      const updateDto = {
        name: 'Updated EC2 Instance',
        status: 'stopped',
        cost: 0.0,
      };

      const resourceWithRelations = {
        ...mockResource,
        cloudProvider: mockCloudProvider,
        organization: mockOrganization,
      };

      const updatedResource = {
        ...resourceWithRelations,
        ...updateDto,
        updatedAt: new Date(),
      };

      mockPrismaService.resource.findUnique.mockResolvedValue(resourceWithRelations);
      mockPrismaService.organizationMember.findUnique.mockResolvedValue(mockMember);
      mockPrismaService.resource.update.mockResolvedValue(updatedResource);

      const result = await service.update(mockResource.id, updateDto, mockUser.id);

      expect(result).toEqual(updatedResource);
      expect(mockPrismaService.resource.update).toHaveBeenCalledWith({
        where: { id: mockResource.id },
        data: updateDto,
        include: {
          cloudProvider: true,
        },
      });
    });

    it('should throw NotFoundException if resource does not exist', async () => {
      mockPrismaService.resource.findUnique.mockResolvedValue(null);

      await expect(
        service.update('non-existent-id', { name: 'Updated' }, mockUser.id),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.resource.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user does not have access', async () => {
      mockPrismaService.resource.findUnique.mockResolvedValue({
        ...mockResource,
        cloudProvider: mockCloudProvider,
        organization: mockOrganization,
      });
      mockPrismaService.organizationMember.findUnique.mockResolvedValue(null);

      await expect(
        service.update(mockResource.id, { name: 'Updated' }, mockUser.id),
      ).rejects.toThrow(ForbiddenException);
      expect(mockPrismaService.resource.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete resource when user has access', async () => {
      const resourceWithRelations = {
        ...mockResource,
        cloudProvider: mockCloudProvider,
        organization: mockOrganization,
      };

      mockPrismaService.resource.findUnique.mockResolvedValue(resourceWithRelations);
      mockPrismaService.organizationMember.findUnique.mockResolvedValue(mockMember);
      mockPrismaService.resource.delete.mockResolvedValue(mockResource);

      const result = await service.remove(mockResource.id, mockUser.id);

      expect(result).toEqual(mockResource);
      expect(mockPrismaService.resource.delete).toHaveBeenCalledWith({
        where: { id: mockResource.id },
      });
    });

    it('should throw NotFoundException if resource does not exist', async () => {
      mockPrismaService.resource.findUnique.mockResolvedValue(null);

      await expect(
        service.remove('non-existent-id', mockUser.id),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.resource.delete).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user does not have access', async () => {
      mockPrismaService.resource.findUnique.mockResolvedValue({
        ...mockResource,
        cloudProvider: mockCloudProvider,
        organization: mockOrganization,
      });
      mockPrismaService.organizationMember.findUnique.mockResolvedValue(null);

      await expect(
        service.remove(mockResource.id, mockUser.id),
      ).rejects.toThrow(ForbiddenException);
      expect(mockPrismaService.resource.delete).not.toHaveBeenCalled();
    });
  });
});
