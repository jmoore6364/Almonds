import { Test, TestingModule } from '@nestjs/testing';
import { ProvidersService } from './providers.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('ProvidersService', () => {
  let service: ProvidersService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    cloudProvider: {
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

  const mockProvider = {
    id: 'provider-123',
    organizationId: 'org-123',
    name: 'AWS Production',
    provider: 'aws',
    region: 'us-east-1',
    status: 'connected',
    credentials: {
      accessKeyId: 'AKIA...',
      secretAccessKey: 'secret...',
    },
    lastSynced: new Date('2024-01-15T10:00:00Z'),
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
    createdBy: 'user-123',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProvidersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ProvidersService>(ProvidersService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all providers for organization when user is member', async () => {
      const providers = [
        {
          id: mockProvider.id,
          name: mockProvider.name,
          provider: mockProvider.provider,
          status: mockProvider.status,
          region: mockProvider.region,
          lastSynced: mockProvider.lastSynced,
          createdAt: mockProvider.createdAt,
          updatedAt: mockProvider.updatedAt,
          _count: { resources: 5 },
        },
        {
          id: 'provider-456',
          name: 'Azure Development',
          provider: 'azure',
          status: 'connected',
          region: 'eastus',
          lastSynced: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { resources: 3 },
        },
      ];

      mockPrismaService.organizationMember.findUnique.mockResolvedValue(mockMember);
      mockPrismaService.cloudProvider.findMany.mockResolvedValue(providers);

      const result = await service.findAll(mockOrganization.id, mockUser.id);

      expect(result).toEqual(providers);
      expect(mockPrismaService.cloudProvider.findMany).toHaveBeenCalledWith({
        where: { organizationId: mockOrganization.id },
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
    });

    it('should throw ForbiddenException if user is not a member', async () => {
      mockPrismaService.organizationMember.findUnique.mockResolvedValue(null);

      await expect(
        service.findAll(mockOrganization.id, mockUser.id),
      ).rejects.toThrow(ForbiddenException);
      expect(mockPrismaService.cloudProvider.findMany).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return provider without credentials when it exists and user has access', async () => {
      const providerWithRelations = {
        ...mockProvider,
        organization: mockOrganization,
        _count: { resources: 5 },
      };

      mockPrismaService.cloudProvider.findUnique.mockResolvedValue(providerWithRelations);
      mockPrismaService.organizationMember.findUnique.mockResolvedValue(mockMember);

      const result = await service.findOne(mockProvider.id, mockUser.id);

      // Should not include credentials
      expect(result).not.toHaveProperty('credentials');
      expect(result).toMatchObject({
        id: mockProvider.id,
        name: mockProvider.name,
        provider: mockProvider.provider,
        status: mockProvider.status,
        organization: mockOrganization,
        _count: { resources: 5 },
      });

      expect(mockPrismaService.cloudProvider.findUnique).toHaveBeenCalledWith({
        where: { id: mockProvider.id },
        include: {
          organization: true,
          _count: {
            select: {
              resources: true,
            },
          },
        },
      });
    });

    it('should throw NotFoundException if provider does not exist', async () => {
      mockPrismaService.cloudProvider.findUnique.mockResolvedValue(null);

      await expect(
        service.findOne('non-existent-id', mockUser.id),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not a member of provider organization', async () => {
      mockPrismaService.cloudProvider.findUnique.mockResolvedValue({
        ...mockProvider,
        organization: mockOrganization,
        _count: { resources: 5 },
      });
      mockPrismaService.organizationMember.findUnique.mockResolvedValue(null);

      await expect(
        service.findOne(mockProvider.id, mockUser.id),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('create', () => {
    it('should create provider when user has access to organization', async () => {
      const createDto = {
        organizationId: mockOrganization.id,
        name: 'AWS Staging',
        provider: 'aws',
        region: 'us-west-2',
        credentials: {
          accessKeyId: 'AKIA...',
          secretAccessKey: 'secret...',
        },
        status: 'pending',
      };

      const createdProvider = {
        id: 'provider-new',
        name: createDto.name,
        provider: createDto.provider,
        status: createDto.status,
        region: createDto.region,
        createdAt: new Date(),
      };

      mockPrismaService.organizationMember.findUnique.mockResolvedValue(mockMember);
      mockPrismaService.cloudProvider.create.mockResolvedValue(createdProvider);

      const result = await service.create(createDto, mockUser.id);

      expect(result).toEqual(createdProvider);
      expect(mockPrismaService.cloudProvider.create).toHaveBeenCalledWith({
        data: {
          ...createDto,
          createdBy: mockUser.id,
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
    });

    it('should throw ForbiddenException if user is not a member of organization', async () => {
      const createDto = {
        organizationId: mockOrganization.id,
        name: 'New Provider',
        provider: 'aws',
        region: 'us-east-1',
        credentials: {},
        status: 'pending',
      };

      mockPrismaService.organizationMember.findUnique.mockResolvedValue(null);

      await expect(
        service.create(createDto, mockUser.id),
      ).rejects.toThrow(ForbiddenException);
      expect(mockPrismaService.cloudProvider.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update provider when user has access', async () => {
      const updateDto = {
        name: 'AWS Production Updated',
        status: 'disconnected',
      };

      const providerWithoutCredentials = {
        id: mockProvider.id,
        organizationId: mockProvider.organizationId,
        name: mockProvider.name,
        provider: mockProvider.provider,
        status: mockProvider.status,
        region: mockProvider.region,
        lastSynced: mockProvider.lastSynced,
        createdAt: mockProvider.createdAt,
        updatedAt: mockProvider.updatedAt,
        organization: mockOrganization,
        _count: { resources: 5 },
      };

      const updatedProvider = {
        id: mockProvider.id,
        name: updateDto.name,
        provider: mockProvider.provider,
        status: updateDto.status,
        region: mockProvider.region,
        updatedAt: new Date(),
      };

      mockPrismaService.cloudProvider.findUnique.mockResolvedValue({
        ...mockProvider,
        organization: mockOrganization,
        _count: { resources: 5 },
      });
      mockPrismaService.organizationMember.findUnique.mockResolvedValue(mockMember);
      mockPrismaService.cloudProvider.update.mockResolvedValue(updatedProvider);

      const result = await service.update(mockProvider.id, updateDto, mockUser.id);

      expect(result).toEqual(updatedProvider);
      expect(mockPrismaService.cloudProvider.update).toHaveBeenCalledWith({
        where: { id: mockProvider.id },
        data: updateDto,
        select: {
          id: true,
          name: true,
          provider: true,
          status: true,
          region: true,
          updatedAt: true,
        },
      });
    });

    it('should throw NotFoundException if provider does not exist', async () => {
      mockPrismaService.cloudProvider.findUnique.mockResolvedValue(null);

      await expect(
        service.update('non-existent-id', { name: 'Updated' }, mockUser.id),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.cloudProvider.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user does not have access', async () => {
      mockPrismaService.cloudProvider.findUnique.mockResolvedValue({
        ...mockProvider,
        organization: mockOrganization,
        _count: { resources: 5 },
      });
      mockPrismaService.organizationMember.findUnique.mockResolvedValue(null);

      await expect(
        service.update(mockProvider.id, { name: 'Updated' }, mockUser.id),
      ).rejects.toThrow(ForbiddenException);
      expect(mockPrismaService.cloudProvider.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete provider when user has access', async () => {
      mockPrismaService.cloudProvider.findUnique.mockResolvedValue({
        ...mockProvider,
        organization: mockOrganization,
        _count: { resources: 5 },
      });
      mockPrismaService.organizationMember.findUnique.mockResolvedValue(mockMember);
      mockPrismaService.cloudProvider.delete.mockResolvedValue(mockProvider);

      const result = await service.remove(mockProvider.id, mockUser.id);

      expect(result).toEqual(mockProvider);
      expect(mockPrismaService.cloudProvider.delete).toHaveBeenCalledWith({
        where: { id: mockProvider.id },
      });
    });

    it('should throw NotFoundException if provider does not exist', async () => {
      mockPrismaService.cloudProvider.findUnique.mockResolvedValue(null);

      await expect(
        service.remove('non-existent-id', mockUser.id),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.cloudProvider.delete).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user does not have access', async () => {
      mockPrismaService.cloudProvider.findUnique.mockResolvedValue({
        ...mockProvider,
        organization: mockOrganization,
        _count: { resources: 5 },
      });
      mockPrismaService.organizationMember.findUnique.mockResolvedValue(null);

      await expect(
        service.remove(mockProvider.id, mockUser.id),
      ).rejects.toThrow(ForbiddenException);
      expect(mockPrismaService.cloudProvider.delete).not.toHaveBeenCalled();
    });
  });

  describe('syncResources', () => {
    it('should update lastSynced timestamp and return sync initiated message', async () => {
      const providerWithoutCredentials = {
        id: mockProvider.id,
        organizationId: mockProvider.organizationId,
        name: mockProvider.name,
        provider: mockProvider.provider,
        status: mockProvider.status,
        region: mockProvider.region,
        lastSynced: mockProvider.lastSynced,
        createdAt: mockProvider.createdAt,
        updatedAt: mockProvider.updatedAt,
        organization: mockOrganization,
        _count: { resources: 5 },
      };

      mockPrismaService.cloudProvider.findUnique.mockResolvedValue({
        ...mockProvider,
        organization: mockOrganization,
        _count: { resources: 5 },
      });
      mockPrismaService.organizationMember.findUnique.mockResolvedValue(mockMember);
      mockPrismaService.cloudProvider.update.mockResolvedValue({
        ...mockProvider,
        lastSynced: new Date(),
      });

      const result = await service.syncResources(mockProvider.id, mockUser.id);

      expect(result).toEqual({
        message: 'Resource sync initiated',
        providerId: mockProvider.id,
        provider: mockProvider.provider,
      });

      expect(mockPrismaService.cloudProvider.update).toHaveBeenCalledWith({
        where: { id: mockProvider.id },
        data: {
          lastSynced: expect.any(Date),
        },
      });
    });

    it('should throw NotFoundException if provider does not exist', async () => {
      mockPrismaService.cloudProvider.findUnique.mockResolvedValue(null);

      await expect(
        service.syncResources('non-existent-id', mockUser.id),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not have access', async () => {
      mockPrismaService.cloudProvider.findUnique.mockResolvedValue({
        ...mockProvider,
        organization: mockOrganization,
        _count: { resources: 5 },
      });
      mockPrismaService.organizationMember.findUnique.mockResolvedValue(null);

      await expect(
        service.syncResources(mockProvider.id, mockUser.id),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
