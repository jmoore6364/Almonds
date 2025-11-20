import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Resources (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: string;
  let organizationId: string;
  let cloudProviderId: string;
  let resourceId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Clean up database
    await prisma.resource.deleteMany();
    await prisma.cloudProvider.deleteMany();
    await prisma.organizationMember.deleteMany();
    await prisma.organization.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('Setup - User, Organization, and Provider', () => {
    it('should register a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'resource-test@example.com',
          name: 'Resource Test User',
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
          name: 'Resource Test Org',
          description: 'Testing resources',
        })
        .expect(201);

      organizationId = response.body.id;
    });

    it('should create a cloud provider', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/providers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          organizationId,
          name: 'AWS Test',
          provider: 'aws',
          region: 'us-east-1',
          credentials: {
            accessKeyId: 'AKIA...',
            secretAccessKey: 'secret...',
          },
          status: 'connected',
        })
        .expect(201);

      cloudProviderId = response.body.id;
    });
  });

  describe('POST /api/v1/resources', () => {
    it('should create a new resource', () => {
      return request(app.getHttpServer())
        .post('/api/v1/resources')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          organizationId,
          cloudProviderId,
          name: 'EC2 Instance - Web Server',
          type: 'compute',
          provider: 'aws',
          resourceId: 'i-1234567890abcdef0',
          region: 'us-east-1',
          status: 'running',
          metadata: {
            instanceType: 't3.micro',
            platform: 'linux',
            publicIp: '54.123.45.67',
          },
          cost: 0.0104,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe('EC2 Instance - Web Server');
          expect(res.body.type).toBe('compute');
          expect(res.body.provider).toBe('aws');
          expect(res.body.resourceId).toBe('i-1234567890abcdef0');
          expect(res.body.status).toBe('running');
          expect(res.body.cost).toBe(0.0104);
          expect(res.body.cloudProvider).toBeDefined();
          expect(res.body.cloudProvider.name).toBe('AWS Test');
          resourceId = res.body.id;
        });
    });

    it('should create a storage resource', () => {
      return request(app.getHttpServer())
        .post('/api/v1/resources')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          organizationId,
          cloudProviderId,
          name: 'S3 Bucket - Uploads',
          type: 'storage',
          provider: 'aws',
          resourceId: 'my-uploads-bucket',
          region: 'us-east-1',
          status: 'active',
          metadata: {
            bucketName: 'my-uploads-bucket',
            versioning: true,
          },
          cost: 0.023,
        })
        .expect(201);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post('/api/v1/resources')
        .send({
          organizationId,
          cloudProviderId,
          name: 'Test Resource',
          type: 'compute',
          provider: 'aws',
          resourceId: 'test-123',
          region: 'us-east-1',
          status: 'running',
        })
        .expect(401);
    });

    it('should fail with invalid data', () => {
      return request(app.getHttpServer())
        .post('/api/v1/resources')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          organizationId,
          // Missing required fields
          name: 'Incomplete Resource',
        })
        .expect(400);
    });
  });

  describe('GET /api/v1/organizations/:organizationId/resources', () => {
    it('should return all resources for organization', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/organizations/${organizationId}/resources`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThanOrEqual(2);
          expect(res.body[0]).toHaveProperty('id');
          expect(res.body[0]).toHaveProperty('name');
          expect(res.body[0]).toHaveProperty('type');
          expect(res.body[0]).toHaveProperty('cloudProvider');
        });
    });

    it('should filter resources by type', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/organizations/${organizationId}/resources?type=compute`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          res.body.forEach((resource) => {
            expect(resource.type).toBe('compute');
          });
        });
    });

    it('should filter resources by provider', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/organizations/${organizationId}/resources?provider=aws`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          res.body.forEach((resource) => {
            expect(resource.provider).toBe('aws');
          });
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/organizations/${organizationId}/resources`)
        .expect(401);
    });
  });

  describe('GET /api/v1/resources/:id', () => {
    it('should return resource details if user has access', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/resources/${resourceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(resourceId);
          expect(res.body.name).toBe('EC2 Instance - Web Server');
          expect(res.body.cloudProvider).toBeDefined();
          expect(res.body.organization).toBeDefined();
          expect(res.body.metadata).toBeDefined();
          expect(res.body.metadata.instanceType).toBe('t3.micro');
        });
    });

    it('should fail for non-existent resource', () => {
      return request(app.getHttpServer())
        .get('/api/v1/resources/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/resources/${resourceId}`)
        .expect(401);
    });
  });

  describe('PATCH /api/v1/resources/:id', () => {
    it('should update resource if user has access', () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/resources/${resourceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'EC2 Instance - Updated',
          status: 'stopped',
          cost: 0.0,
          metadata: {
            instanceType: 't3.small',
            platform: 'linux',
            publicIp: '54.123.45.67',
          },
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe('EC2 Instance - Updated');
          expect(res.body.status).toBe('stopped');
          expect(res.body.cost).toBe(0.0);
          expect(res.body.metadata.instanceType).toBe('t3.small');
        });
    });

    it('should fail for non-existent resource', () => {
      return request(app.getHttpServer())
        .patch('/api/v1/resources/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Name',
        })
        .expect(404);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/resources/${resourceId}`)
        .send({
          name: 'Updated Name',
        })
        .expect(401);
    });
  });

  describe('DELETE /api/v1/resources/:id', () => {
    let resourceToDelete: string;

    beforeAll(async () => {
      // Create a resource specifically for deletion test
      const response = await request(app.getHttpServer())
        .post('/api/v1/resources')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          organizationId,
          cloudProviderId,
          name: 'Resource to Delete',
          type: 'compute',
          provider: 'aws',
          resourceId: 'i-deleteme',
          region: 'us-east-1',
          status: 'running',
          cost: 0.01,
        })
        .expect(201);

      resourceToDelete = response.body.id;
    });

    it('should delete resource if user has access', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/resources/${resourceToDelete}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(resourceToDelete);
        });
    });

    it('should fail to get deleted resource', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/resources/${resourceToDelete}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should fail for non-existent resource', () => {
      return request(app.getHttpServer())
        .delete('/api/v1/resources/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/resources/${resourceId}`)
        .expect(401);
    });
  });
});
