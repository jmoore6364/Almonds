import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Billing (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: string;
  let organizationId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Clean up database
    await prisma.usageRecord.deleteMany();
    await prisma.subscription.deleteMany();
    await prisma.organizationMember.deleteMany();
    await prisma.organization.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('Setup - User and Organization', () => {
    it('should register a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'billing-test@example.com',
          name: 'Billing Test User',
          password: 'password123',
        })
        .expect(201);

      authToken = response.body.access_token;
      userId = response.body.user.id;
    });

    it('should create an organization', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/organizations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Billing Test Org',
          description: 'Testing billing',
        })
        .expect(201);

      organizationId = response.body.id;
    });
  });

  describe('POST /api/v1/billing/checkout-session', () => {
    it('should create a checkout session for Pro plan', () => {
      return request(app.getHttpServer())
        .post('/api/v1/billing/checkout-session')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          organizationId,
          plan: 'pro',
          successUrl: 'https://app.almonds.io/success',
          cancelUrl: 'https://app.almonds.io/cancel',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('sessionId');
          expect(res.body).toHaveProperty('url');
          expect(typeof res.body.sessionId).toBe('string');
          expect(typeof res.body.url).toBe('string');
        });
    });

    it('should create a checkout session for Business plan', () => {
      return request(app.getHttpServer())
        .post('/api/v1/billing/checkout-session')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          organizationId,
          plan: 'business',
          successUrl: 'https://app.almonds.io/success',
          cancelUrl: 'https://app.almonds.io/cancel',
        })
        .expect(201);
    });

    it('should fail for invalid plan', () => {
      return request(app.getHttpServer())
        .post('/api/v1/billing/checkout-session')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          organizationId,
          plan: 'invalid-plan',
          successUrl: 'https://app.almonds.io/success',
          cancelUrl: 'https://app.almonds.io/cancel',
        })
        .expect(400);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post('/api/v1/billing/checkout-session')
        .send({
          organizationId,
          plan: 'pro',
          successUrl: 'https://app.almonds.io/success',
          cancelUrl: 'https://app.almonds.io/cancel',
        })
        .expect(401);
    });
  });

  describe('POST /api/v1/billing/portal-session', () => {
    beforeAll(async () => {
      // Update organization with a Stripe customer ID for portal access
      await prisma.organization.update({
        where: { id: organizationId },
        data: { stripeCustomerId: 'cus_test_123' },
      });
    });

    it('should create a billing portal session', () => {
      return request(app.getHttpServer())
        .post('/api/v1/billing/portal-session')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          organizationId,
          returnUrl: 'https://app.almonds.io/settings/billing',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('url');
          expect(typeof res.body.url).toBe('string');
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post('/api/v1/billing/portal-session')
        .send({
          organizationId,
          returnUrl: 'https://app.almonds.io/settings/billing',
        })
        .expect(401);
    });
  });

  describe('GET /api/v1/billing/subscription/:organizationId', () => {
    it('should return subscription details for organization', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/billing/subscription/${organizationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('plan');
          expect(res.body.plan).toBe('free'); // Default plan
          expect(res.body.organizationId).toBe(organizationId);
        });
    });

    it('should fail for non-existent organization', () => {
      return request(app.getHttpServer())
        .get('/api/v1/billing/subscription/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/billing/subscription/${organizationId}`)
        .expect(401);
    });
  });

  describe('GET /api/v1/billing/usage/:organizationId', () => {
    beforeAll(async () => {
      // Create some usage records for testing
      await prisma.usageRecord.createMany({
        data: [
          {
            organizationId,
            metricType: 'api_requests',
            value: 150,
            timestamp: new Date(),
          },
          {
            organizationId,
            metricType: 'resources',
            value: 3,
            timestamp: new Date(),
          },
          {
            organizationId,
            metricType: 'api_requests',
            value: 200,
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
          },
        ],
      });
    });

    it('should return usage statistics for organization', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/billing/usage/${organizationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('organizationId');
          expect(res.body.organizationId).toBe(organizationId);
          expect(res.body).toHaveProperty('currentPlan');
          expect(res.body).toHaveProperty('usage');
          expect(res.body.usage).toHaveProperty('api_requests');
          expect(res.body.usage).toHaveProperty('resources');
          expect(res.body.usage.api_requests).toBeGreaterThan(0);
        });
    });

    it('should filter usage by date range', () => {
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      return request(app.getHttpServer())
        .get(`/api/v1/billing/usage/${organizationId}?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('usage');
        });
    });

    it('should fail for non-existent organization', () => {
      return request(app.getHttpServer())
        .get('/api/v1/billing/usage/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/billing/usage/${organizationId}`)
        .expect(401);
    });
  });

  describe('GET /api/v1/billing/check-limit/:organizationId', () => {
    it('should check API request limit', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/billing/check-limit/${organizationId}?limitType=apiRequestsPerDay`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('allowed');
          expect(typeof res.body.allowed).toBe('boolean');
          expect(res.body).toHaveProperty('limit');
          expect(res.body).toHaveProperty('current');
        });
    });

    it('should check resources limit', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/billing/check-limit/${organizationId}?limitType=resources`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('allowed');
          expect(res.body).toHaveProperty('limit');
          expect(res.body).toHaveProperty('current');
        });
    });

    it('should check organizations limit', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/billing/check-limit/${organizationId}?limitType=organizations`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should fail for invalid limit type', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/billing/check-limit/${organizationId}?limitType=invalid`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/billing/check-limit/${organizationId}?limitType=resources`)
        .expect(401);
    });
  });

  describe('POST /api/v1/billing/webhook', () => {
    it('should handle webhook with invalid signature', () => {
      return request(app.getHttpServer())
        .post('/api/v1/billing/webhook')
        .set('stripe-signature', 'invalid_signature')
        .send({
          type: 'checkout.session.completed',
          data: {},
        })
        .expect(400);
    });

    // Note: Full webhook testing requires Stripe webhook signatures
    // which are difficult to mock in E2E tests. In production,
    // use Stripe CLI for webhook testing: stripe listen --forward-to localhost:3000/api/v1/billing/webhook
  });

  describe('POST /api/v1/billing/track-usage', () => {
    it('should track API request usage', () => {
      return request(app.getHttpServer())
        .post('/api/v1/billing/track-usage')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          organizationId,
          metricType: 'api_requests',
          value: 1,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.metricType).toBe('api_requests');
          expect(res.body.value).toBe(1);
          expect(res.body.organizationId).toBe(organizationId);
        });
    });

    it('should track resource usage', () => {
      return request(app.getHttpServer())
        .post('/api/v1/billing/track-usage')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          organizationId,
          metricType: 'resources',
          value: 1,
        })
        .expect(201);
    });

    it('should fail with invalid metric type', () => {
      return request(app.getHttpServer())
        .post('/api/v1/billing/track-usage')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          organizationId,
          metricType: 'invalid_metric',
          value: 1,
        })
        .expect(400);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post('/api/v1/billing/track-usage')
        .send({
          organizationId,
          metricType: 'api_requests',
          value: 1,
        })
        .expect(401);
    });
  });
});
