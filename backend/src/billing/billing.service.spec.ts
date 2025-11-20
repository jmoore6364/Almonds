import { Test, TestingModule } from '@nestjs/testing';
import { BillingService } from './billing.service';
import { StripeService } from './stripe.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

describe('BillingService', () => {
  let service: BillingService;
  let prismaService: PrismaService;
  let stripeService: StripeService;

  const mockOrganization = {
    id: 'org-123',
    name: 'Test Org',
    slug: 'test-org',
    plan: 'free',
    stripeCustomerId: 'cus_123',
  };

  const mockPrismaService = {
    organization: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    subscription: {
      create: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
    usageTracking: {
      create: jest.fn(),
      aggregate: jest.fn(),
    },
    resource: {
      count: jest.fn(),
    },
    organizationMember: {
      count: jest.fn(),
    },
    cloudProvider: {
      count: jest.fn(),
    },
  };

  const mockStripeService = {
    createCustomer: jest.fn(),
    createCheckoutSession: jest.fn(),
    createBillingPortalSession: jest.fn(),
    getSubscription: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        FRONTEND_URL: 'http://localhost:8100',
        STRIPE_PRICE_ID_PRO: 'price_pro',
        STRIPE_PRICE_ID_BUSINESS: 'price_business',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: StripeService, useValue: mockStripeService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
    prismaService = module.get<PrismaService>(PrismaService);
    stripeService = module.get<StripeService>(StripeService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createCheckoutSession', () => {
    it('should create checkout session for organization', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(mockOrganization);
      mockStripeService.createCheckoutSession.mockResolvedValue({
        id: 'cs_123',
        url: 'https://checkout.stripe.com/...',
      });

      const result = await service.createCheckoutSession(
        'org-123',
        'price_pro',
        'user-123',
      );

      expect(result).toHaveProperty('sessionId');
      expect(result).toHaveProperty('url');
      expect(mockStripeService.createCheckoutSession).toHaveBeenCalled();
    });

    it('should create Stripe customer if not exists', async () => {
      const orgWithoutStripe = { ...mockOrganization, stripeCustomerId: null };
      mockPrismaService.organization.findUnique.mockResolvedValue(orgWithoutStripe);
      mockStripeService.createCustomer.mockResolvedValue({ id: 'cus_new' });
      mockStripeService.createCheckoutSession.mockResolvedValue({
        id: 'cs_123',
        url: 'https://checkout.stripe.com/...',
      });

      await service.createCheckoutSession('org-123', 'price_pro', 'user-123');

      expect(mockStripeService.createCustomer).toHaveBeenCalled();
      expect(mockPrismaService.organization.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ stripeCustomerId: 'cus_new' }),
        }),
      );
    });
  });

  describe('checkLimit', () => {
    it('should return true when under limit', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(mockOrganization);
      mockPrismaService.resource.count.mockResolvedValue(3);

      const result = await service.checkLimit('org-123', 'resources');

      expect(result).toBe(true); // Free plan allows 5 resources, user has 3
    });

    it('should return false when over limit', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(mockOrganization);
      mockPrismaService.resource.count.mockResolvedValue(6);

      const result = await service.checkLimit('org-123', 'resources');

      expect(result).toBe(false); // Free plan allows 5 resources, user has 6
    });

    it('should return true for unlimited plan', async () => {
      const enterpriseOrg = { ...mockOrganization, plan: 'enterprise' };
      mockPrismaService.organization.findUnique.mockResolvedValue(enterpriseOrg);

      const result = await service.checkLimit('org-123', 'resources');

      expect(result).toBe(true); // Enterprise has unlimited
    });
  });

  describe('trackUsage', () => {
    it('should create usage tracking record', async () => {
      await service.trackUsage('org-123', 'api_requests', 10);

      expect(mockPrismaService.usageTracking.create).toHaveBeenCalledWith({
        data: {
          organizationId: 'org-123',
          metricType: 'api_requests',
          quantity: 10,
          unit: 'requests',
        },
      });
    });
  });

  describe('getPlanLimits', () => {
    it('should return correct limits for free plan', () => {
      const limits = service.getPlanLimits('free');

      expect(limits.resources).toBe(5);
      expect(limits.apiRequestsPerDay).toBe(100);
      expect(limits.organizations).toBe(1);
    });

    it('should return correct limits for pro plan', () => {
      const limits = service.getPlanLimits('pro');

      expect(limits.resources).toBe(50);
      expect(limits.apiRequestsPerDay).toBe(1000);
      expect(limits.organizations).toBe(3);
    });

    it('should return unlimited for enterprise plan', () => {
      const limits = service.getPlanLimits('enterprise');

      expect(limits.resources).toBe(-1); // -1 means unlimited
      expect(limits.apiRequestsPerDay).toBe(-1);
    });
  });
});
