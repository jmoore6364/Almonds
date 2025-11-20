import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Organizations (e2e)', () => {
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
    await prisma.organizationMember.deleteMany();
    await prisma.organization.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('Setup - User Registration and Login', () => {
    it('should register a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'org-test@example.com',
          name: 'Org Test User',
          password: 'password123',
        })
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      authToken = response.body.access_token;
      userId = response.body.user.id;
    });
  });

  describe('POST /api/v1/organizations', () => {
    it('should create a new organization', () => {
      return request(app.getHttpServer())
        .post('/api/v1/organizations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Organization',
          description: 'An organization for testing',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe('Test Organization');
          expect(res.body.slug).toBe('test-organization');
          expect(res.body.description).toBe('An organization for testing');
          expect(res.body.members).toHaveLength(1);
          expect(res.body.members[0].role).toBe('owner');
          expect(res.body.members[0].userId).toBe(userId);
          organizationId = res.body.id;
        });
    });

    it('should generate slug correctly for special characters', () => {
      return request(app.getHttpServer())
        .post('/api/v1/organizations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'My Awesome Company!!!',
          description: 'Testing slug generation',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.slug).toBe('my-awesome-company');
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post('/api/v1/organizations')
        .send({
          name: 'Test Organization',
          description: 'Test',
        })
        .expect(401);
    });

    it('should fail with invalid data', () => {
      return request(app.getHttpServer())
        .post('/api/v1/organizations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '', // Empty name should fail validation
        })
        .expect(400);
    });
  });

  describe('GET /api/v1/organizations', () => {
    it('should return all organizations for authenticated user', () => {
      return request(app.getHttpServer())
        .get('/api/v1/organizations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThanOrEqual(2);
          expect(res.body[0]).toHaveProperty('id');
          expect(res.body[0]).toHaveProperty('name');
          expect(res.body[0]).toHaveProperty('role');
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get('/api/v1/organizations')
        .expect(401);
    });
  });

  describe('GET /api/v1/organizations/:id', () => {
    it('should return organization details if user is a member', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/organizations/${organizationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(organizationId);
          expect(res.body.name).toBe('Test Organization');
          expect(res.body.members).toBeDefined();
          expect(res.body._count).toBeDefined();
          expect(res.body._count).toHaveProperty('resources');
          expect(res.body._count).toHaveProperty('apiKeys');
          expect(res.body._count).toHaveProperty('webhooks');
        });
    });

    it('should fail for non-existent organization', () => {
      return request(app.getHttpServer())
        .get('/api/v1/organizations/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/organizations/${organizationId}`)
        .expect(401);
    });
  });

  describe('PATCH /api/v1/organizations/:id', () => {
    it('should update organization if user is owner/admin', () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/organizations/${organizationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Test Organization',
          description: 'Updated description',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe('Updated Test Organization');
          expect(res.body.description).toBe('Updated description');
        });
    });

    it('should fail for non-existent organization', () => {
      return request(app.getHttpServer())
        .patch('/api/v1/organizations/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Name',
        })
        .expect(404);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/organizations/${organizationId}`)
        .send({
          name: 'Updated Name',
        })
        .expect(401);
    });
  });

  describe('GET /api/v1/organizations/:id/members', () => {
    it('should return organization members if user is a member', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/organizations/${organizationId}/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThanOrEqual(1);
          expect(res.body[0]).toHaveProperty('role');
          expect(res.body[0]).toHaveProperty('user');
          expect(res.body[0].user).toHaveProperty('email');
          expect(res.body[0].user).toHaveProperty('name');
          expect(res.body[0].user).not.toHaveProperty('passwordHash');
        });
    });

    it('should fail for non-existent organization', () => {
      return request(app.getHttpServer())
        .get('/api/v1/organizations/non-existent-id/members')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/organizations/${organizationId}/members`)
        .expect(401);
    });
  });

  describe('DELETE /api/v1/organizations/:id', () => {
    let orgToDelete: string;

    beforeAll(async () => {
      // Create a new organization specifically for deletion test
      const response = await request(app.getHttpServer())
        .post('/api/v1/organizations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Organization to Delete',
          description: 'Will be deleted',
        })
        .expect(201);

      orgToDelete = response.body.id;
    });

    it('should delete organization if user is owner', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/organizations/${orgToDelete}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(orgToDelete);
        });
    });

    it('should fail to get deleted organization', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/organizations/${orgToDelete}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should fail for non-existent organization', () => {
      return request(app.getHttpServer())
        .delete('/api/v1/organizations/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/organizations/${organizationId}`)
        .expect(401);
    });
  });
});
