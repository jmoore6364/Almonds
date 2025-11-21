import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction, AuditStatus } from './dto/create-audit-log.dto';

describe('AuditService', () => {
  let service: AuditService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
      deleteMany: jest.fn(),
    },
    $queryRaw: jest.fn(),
  };

  const mockAuditLog = {
    id: 'audit-123',
    organizationId: 'org-123',
    userId: 'user-123',
    action: AuditAction.USER_LOGIN,
    resource: null,
    resourceId: null,
    details: {},
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
    status: AuditStatus.SUCCESS,
    createdAt: new Date(),
  };

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('log', () => {
    it('should create an audit log entry', async () => {
      mockPrismaService.auditLog.create.mockResolvedValue(mockAuditLog);

      const result = await service.log({
        organizationId: 'org-123',
        userId: 'user-123',
        action: AuditAction.USER_LOGIN,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      });

      expect(result).toEqual(mockAuditLog);
      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: {
          organizationId: 'org-123',
          userId: 'user-123',
          action: AuditAction.USER_LOGIN,
          resource: undefined,
          resourceId: undefined,
          details: {},
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          status: AuditStatus.SUCCESS,
        },
      });
    });

    it('should handle errors gracefully and return null', async () => {
      mockPrismaService.auditLog.create.mockRejectedValue(new Error('Database error'));

      const result = await service.log({
        organizationId: 'org-123',
        userId: 'user-123',
        action: AuditAction.USER_LOGIN,
      });

      expect(result).toBeNull();
    });

    it('should include details and metadata when provided', async () => {
      const details = { loginMethod: 'email' };
      const expectedLog = { ...mockAuditLog, details, resource: 'user', resourceId: 'user-123' };

      mockPrismaService.auditLog.create.mockResolvedValue(expectedLog);

      const result = await service.log({
        organizationId: 'org-123',
        userId: 'user-123',
        action: AuditAction.USER_LOGIN,
        resource: 'user',
        resourceId: 'user-123',
        details,
      });

      expect(result).toEqual(expectedLog);
      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          details,
          resource: 'user',
          resourceId: 'user-123',
        }),
      });
    });
  });

  describe('logSuccess', () => {
    it('should log a successful action', async () => {
      mockPrismaService.auditLog.create.mockResolvedValue(mockAuditLog);

      const result = await service.logSuccess(
        'org-123',
        'user-123',
        AuditAction.RESOURCE_CREATE,
        { resourceName: 'test-resource' },
        {
          ipAddress: '192.168.1.1',
          resource: 'resource',
          resourceId: 'resource-456',
        },
      );

      expect(result).toEqual(mockAuditLog);
      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: AuditStatus.SUCCESS,
          action: AuditAction.RESOURCE_CREATE,
          details: { resourceName: 'test-resource' },
          resource: 'resource',
          resourceId: 'resource-456',
        }),
      });
    });
  });

  describe('logFailure', () => {
    it('should log a failed action with error details', async () => {
      const error = new Error('Operation failed');
      const expectedLog = { ...mockAuditLog, status: AuditStatus.FAILURE };

      mockPrismaService.auditLog.create.mockResolvedValue(expectedLog);

      const result = await service.logFailure('org-123', 'user-123', AuditAction.RESOURCE_DELETE, error, {
        ipAddress: '192.168.1.1',
      });

      expect(result).toEqual(expectedLog);
      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: AuditStatus.FAILURE,
          action: AuditAction.RESOURCE_DELETE,
          details: expect.objectContaining({
            error: 'Operation failed',
          }),
        }),
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated audit logs', async () => {
      const mockLogs = [
        { ...mockAuditLog, user: mockUser },
        { ...mockAuditLog, id: 'audit-124', action: AuditAction.RESOURCE_CREATE, user: mockUser },
      ];

      mockPrismaService.auditLog.findMany.mockResolvedValue(mockLogs);
      mockPrismaService.auditLog.count.mockResolvedValue(2);

      const result = await service.findAll('org-123', {
        limit: 20,
        offset: 0,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      expect(result.logs).toEqual(mockLogs);
      expect(result.pagination).toEqual({
        total: 2,
        limit: 20,
        offset: 0,
        hasMore: false,
      });
    });

    it('should filter by user ID when provided', async () => {
      mockPrismaService.auditLog.findMany.mockResolvedValue([mockAuditLog]);
      mockPrismaService.auditLog.count.mockResolvedValue(1);

      await service.findAll('org-123', {
        userId: 'user-123',
        limit: 20,
        offset: 0,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          userId: 'user-123',
        }),
        include: expect.any(Object),
        orderBy: expect.any(Object),
        take: 20,
        skip: 0,
      });
    });

    it('should filter by action when provided', async () => {
      mockPrismaService.auditLog.findMany.mockResolvedValue([mockAuditLog]);
      mockPrismaService.auditLog.count.mockResolvedValue(1);

      await service.findAll('org-123', {
        action: AuditAction.USER_LOGIN,
        limit: 20,
        offset: 0,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          action: AuditAction.USER_LOGIN,
        }),
        include: expect.any(Object),
        orderBy: expect.any(Object),
        take: 20,
        skip: 0,
      });
    });

    it('should filter by date range when provided', async () => {
      mockPrismaService.auditLog.findMany.mockResolvedValue([mockAuditLog]);
      mockPrismaService.auditLog.count.mockResolvedValue(1);

      const startDate = '2024-01-01T00:00:00Z';
      const endDate = '2024-01-31T23:59:59Z';

      await service.findAll('org-123', {
        startDate,
        endDate,
        limit: 20,
        offset: 0,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
        include: expect.any(Object),
        orderBy: expect.any(Object),
        take: 20,
        skip: 0,
      });
    });
  });

  describe('findOne', () => {
    it('should return a single audit log', async () => {
      mockPrismaService.auditLog.findFirst.mockResolvedValue({ ...mockAuditLog, user: mockUser });

      const result = await service.findOne('org-123', 'audit-123');

      expect(result).toEqual({ ...mockAuditLog, user: mockUser });
      expect(mockPrismaService.auditLog.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'audit-123',
          organizationId: 'org-123',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    });
  });

  describe('getStatistics', () => {
    it('should return audit log statistics', async () => {
      const mockByAction = [{ action: AuditAction.USER_LOGIN, _count: { action: 10 } }];
      const mockByUser = [{ userId: 'user-123', _count: { userId: 5 } }];
      const mockByStatus = [{ status: AuditStatus.SUCCESS, _count: { status: 15 } }];
      const mockRecentActivity = [{ date: new Date(), count: BigInt(20) }];

      mockPrismaService.auditLog.count.mockResolvedValue(25);
      mockPrismaService.auditLog.groupBy
        .mockResolvedValueOnce(mockByAction)
        .mockResolvedValueOnce(mockByUser)
        .mockResolvedValueOnce(mockByStatus);
      mockPrismaService.$queryRaw.mockResolvedValue(mockRecentActivity);

      const result = await service.getStatistics('org-123');

      expect(result).toHaveProperty('total', 25);
      expect(result).toHaveProperty('byAction');
      expect(result).toHaveProperty('byUser');
      expect(result).toHaveProperty('byStatus');
      expect(result).toHaveProperty('recentActivity');
    });
  });

  describe('exportLogs', () => {
    it('should export all matching audit logs', async () => {
      const mockLogs = [
        { ...mockAuditLog, user: mockUser },
        { ...mockAuditLog, id: 'audit-124', user: mockUser },
      ];

      mockPrismaService.auditLog.findMany.mockResolvedValue(mockLogs);

      const result = await service.exportLogs('org-123', {
        limit: 1000,
        offset: 0,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      expect(result).toEqual(mockLogs);
      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalled();
    });
  });

  describe('deleteOldLogs', () => {
    it('should delete logs older than specified days', async () => {
      mockPrismaService.auditLog.deleteMany.mockResolvedValue({ count: 10 });

      const result = await service.deleteOldLogs('org-123', 90);

      expect(result.count).toBe(10);
      expect(mockPrismaService.auditLog.deleteMany).toHaveBeenCalledWith({
        where: {
          organizationId: 'org-123',
          createdAt: {
            lt: expect.any(Date),
          },
        },
      });
    });
  });
});
