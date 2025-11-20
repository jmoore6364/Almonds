import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationsService } from './organizations.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('OrganizationsService', () => {
  let service: OrganizationsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    organization: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    organizationMember: {
      findMany: jest.fn(),
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
    description: 'Test description',
    plan: 'free',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockMember = {
    id: 'member-123',
    organizationId: 'org-123',
    userId: 'user-123',
    role: 'owner',
    joinedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<OrganizationsService>(OrganizationsService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new organization with user as owner', async () => {
      const createDto = {
        name: 'Test Organization',
        description: 'Test description',
      };

      const expectedOrg = {
        ...mockOrganization,
        members: [
          {
            ...mockMember,
            user: mockUser,
          },
        ],
      };

      mockPrismaService.organization.create.mockResolvedValue(expectedOrg);

      const result = await service.create(mockUser.id, createDto);

      expect(result).toEqual(expectedOrg);
      expect(mockPrismaService.organization.create).toHaveBeenCalledWith({
        data: {
          name: createDto.name,
          slug: 'test-organization',
          description: createDto.description,
          members: {
            create: {
              userId: mockUser.id,
              role: 'owner',
              joinedAt: expect.any(Date),
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
    });

    it('should generate slug from name correctly', async () => {
      const createDto = {
        name: 'My Awesome Organization!!!',
        description: 'Test',
      };

      mockPrismaService.organization.create.mockResolvedValue({
        ...mockOrganization,
        slug: 'my-awesome-organization',
      });

      await service.create(mockUser.id, createDto);

      expect(mockPrismaService.organization.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            slug: 'my-awesome-organization',
          }),
        }),
      );
    });
  });

  describe('findAllForUser', () => {
    it('should return all organizations for a user with their roles', async () => {
      const memberships = [
        {
          ...mockMember,
          organization: mockOrganization,
        },
        {
          id: 'member-456',
          organizationId: 'org-456',
          userId: mockUser.id,
          role: 'admin',
          joinedAt: new Date(),
          organization: {
            id: 'org-456',
            name: 'Second Organization',
            slug: 'second-organization',
            plan: 'pro',
          },
        },
      ];

      mockPrismaService.organizationMember.findMany.mockResolvedValue(memberships);

      const result = await service.findAllForUser(mockUser.id);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        ...mockOrganization,
        role: 'owner',
      });
      expect(result[1]).toMatchObject({
        id: 'org-456',
        name: 'Second Organization',
        role: 'admin',
      });
      expect(mockPrismaService.organizationMember.findMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        include: { organization: true },
      });
    });

    it('should return empty array if user has no organizations', async () => {
      mockPrismaService.organizationMember.findMany.mockResolvedValue([]);

      const result = await service.findAllForUser(mockUser.id);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return organization if user is a member', async () => {
      const orgWithDetails = {
        ...mockOrganization,
        members: [{ ...mockMember, user: mockUser }],
        _count: {
          resources: 5,
          apiKeys: 2,
          webhooks: 1,
        },
      };

      mockPrismaService.organizationMember.findUnique.mockResolvedValue(mockMember);
      mockPrismaService.organization.findUnique.mockResolvedValue(orgWithDetails);

      const result = await service.findOne(mockOrganization.id, mockUser.id);

      expect(result).toEqual(orgWithDetails);
      expect(mockPrismaService.organizationMember.findUnique).toHaveBeenCalledWith({
        where: {
          organizationId_userId: {
            organizationId: mockOrganization.id,
            userId: mockUser.id,
          },
        },
      });
    });

    it('should throw ForbiddenException if user is not a member', async () => {
      mockPrismaService.organizationMember.findUnique.mockResolvedValue(null);

      await expect(
        service.findOne(mockOrganization.id, mockUser.id),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if organization does not exist', async () => {
      mockPrismaService.organizationMember.findUnique.mockResolvedValue(mockMember);
      mockPrismaService.organization.findUnique.mockResolvedValue(null);

      await expect(
        service.findOne(mockOrganization.id, mockUser.id),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update organization if user is admin', async () => {
      const updateDto = {
        name: 'Updated Organization',
        description: 'Updated description',
      };

      const adminMember = { ...mockMember, role: 'admin' };
      const updatedOrg = { ...mockOrganization, ...updateDto };

      mockPrismaService.organizationMember.findUnique.mockResolvedValue(adminMember);
      mockPrismaService.organization.update.mockResolvedValue(updatedOrg);

      const result = await service.update(mockOrganization.id, mockUser.id, updateDto);

      expect(result).toEqual(updatedOrg);
      expect(mockPrismaService.organization.update).toHaveBeenCalledWith({
        where: { id: mockOrganization.id },
        data: updateDto,
      });
    });

    it('should update organization if user is owner', async () => {
      const updateDto = { name: 'Updated Name' };
      const updatedOrg = { ...mockOrganization, ...updateDto };

      mockPrismaService.organizationMember.findUnique.mockResolvedValue(mockMember);
      mockPrismaService.organization.update.mockResolvedValue(updatedOrg);

      const result = await service.update(mockOrganization.id, mockUser.id, updateDto);

      expect(result).toEqual(updatedOrg);
    });

    it('should throw ForbiddenException if user is regular member', async () => {
      const updateDto = { name: 'Updated Name' };
      const memberRole = { ...mockMember, role: 'member' };

      mockPrismaService.organizationMember.findUnique.mockResolvedValue(memberRole);

      await expect(
        service.update(mockOrganization.id, mockUser.id, updateDto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if user is not a member', async () => {
      mockPrismaService.organizationMember.findUnique.mockResolvedValue(null);

      await expect(
        service.update(mockOrganization.id, mockUser.id, {}),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should delete organization if user is owner', async () => {
      mockPrismaService.organizationMember.findUnique.mockResolvedValue(mockMember);
      mockPrismaService.organization.delete.mockResolvedValue(mockOrganization);

      const result = await service.remove(mockOrganization.id, mockUser.id);

      expect(result).toEqual(mockOrganization);
      expect(mockPrismaService.organization.delete).toHaveBeenCalledWith({
        where: { id: mockOrganization.id },
      });
    });

    it('should throw ForbiddenException if user is admin but not owner', async () => {
      const adminMember = { ...mockMember, role: 'admin' };
      mockPrismaService.organizationMember.findUnique.mockResolvedValue(adminMember);

      await expect(
        service.remove(mockOrganization.id, mockUser.id),
      ).rejects.toThrow(ForbiddenException);
      expect(mockPrismaService.organization.delete).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user is not a member', async () => {
      mockPrismaService.organizationMember.findUnique.mockResolvedValue(null);

      await expect(
        service.remove(mockOrganization.id, mockUser.id),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getMembers', () => {
    it('should return organization members if user is a member', async () => {
      const members = [
        {
          ...mockMember,
          user: mockUser,
        },
        {
          id: 'member-456',
          organizationId: mockOrganization.id,
          userId: 'user-456',
          role: 'member',
          joinedAt: new Date(),
          user: {
            id: 'user-456',
            email: 'other@example.com',
            name: 'Other User',
            avatarUrl: null,
          },
        },
      ];

      mockPrismaService.organizationMember.findUnique.mockResolvedValue(mockMember);
      mockPrismaService.organizationMember.findMany.mockResolvedValue(members);

      const result = await service.getMembers(mockOrganization.id, mockUser.id);

      expect(result).toEqual(members);
      expect(mockPrismaService.organizationMember.findMany).toHaveBeenCalledWith({
        where: { organizationId: mockOrganization.id },
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
    });

    it('should throw ForbiddenException if user is not a member', async () => {
      mockPrismaService.organizationMember.findUnique.mockResolvedValue(null);

      await expect(
        service.getMembers(mockOrganization.id, mockUser.id),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
