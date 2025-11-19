import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data (be careful in production!)
  await prisma.auditLog.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.cloudProvider.deleteMany();
  await prisma.organizationMember.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();

  // Create demo users
  const password = await bcrypt.hash('password123', 10);

  const user1 = await prisma.user.create({
    data: {
      email: 'john@example.com',
      name: 'John Doe',
      passwordHash: password,
      emailVerified: true,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'jane@example.com',
      name: 'Jane Smith',
      passwordHash: password,
      emailVerified: true,
    },
  });

  console.log('✅ Created demo users');

  // Create demo organizations
  const org1 = await prisma.organization.create({
    data: {
      name: 'Acme Corporation',
      slug: 'acme-corp',
      description: 'Leading software company',
      website: 'https://acme.example.com',
      plan: 'business',
      status: 'active',
      members: {
        create: [
          {
            userId: user1.id,
            role: 'owner',
            joinedAt: new Date(),
          },
          {
            userId: user2.id,
            role: 'admin',
            joinedAt: new Date(),
          },
        ],
      },
    },
  });

  const org2 = await prisma.organization.create({
    data: {
      name: 'Startup Inc',
      slug: 'startup-inc',
      description: 'Innovative startup',
      plan: 'pro',
      status: 'active',
      members: {
        create: {
          userId: user2.id,
          role: 'owner',
          joinedAt: new Date(),
        },
      },
    },
  });

  console.log('✅ Created demo organizations');

  // Create demo cloud providers
  const awsProvider = await prisma.cloudProvider.create({
    data: {
      organizationId: org1.id,
      provider: 'aws',
      name: 'AWS Production',
      status: 'active',
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'DEMO_ACCESS_KEY',
        secretAccessKey: 'DEMO_SECRET_KEY',
      },
      createdBy: user1.id,
    },
  });

  const azureProvider = await prisma.cloudProvider.create({
    data: {
      organizationId: org1.id,
      provider: 'azure',
      name: 'Azure Development',
      status: 'active',
      region: 'eastus',
      credentials: {
        tenantId: 'demo-tenant-id',
        clientId: 'demo-client-id',
        clientSecret: 'demo-client-secret',
      },
      createdBy: user1.id,
    },
  });

  console.log('✅ Created demo cloud providers');

  // Create demo resources
  const resources = [
    {
      organizationId: org1.id,
      providerId: awsProvider.id,
      externalId: 'i-1234567890abcdef0',
      name: 'Production Web Server',
      type: 'compute',
      provider: 'aws',
      status: 'running',
      region: 'us-east-1',
      tags: { environment: 'production', team: 'backend' },
      metadata: { instanceType: 't3.medium', publicIp: '54.123.45.67' },
      costPerMonth: 49.99,
      createdBy: user1.id,
    },
    {
      organizationId: org1.id,
      providerId: awsProvider.id,
      externalId: 'db-abcdef1234567890',
      name: 'Production Database',
      type: 'database',
      provider: 'aws',
      status: 'running',
      region: 'us-east-1',
      tags: { environment: 'production', team: 'backend' },
      metadata: { engine: 'postgresql', instanceClass: 'db.t3.medium' },
      costPerMonth: 99.99,
      createdBy: user1.id,
    },
    {
      organizationId: org1.id,
      providerId: awsProvider.id,
      externalId: 'bucket-prod-assets',
      name: 'Production Assets Bucket',
      type: 'storage',
      provider: 'aws',
      status: 'active',
      region: 'us-east-1',
      tags: { environment: 'production', team: 'frontend' },
      metadata: { storageClass: 'STANDARD', sizeGB: 150 },
      costPerMonth: 3.45,
      createdBy: user1.id,
    },
    {
      organizationId: org1.id,
      providerId: azureProvider.id,
      externalId: 'vm-dev-01',
      name: 'Development VM',
      type: 'compute',
      provider: 'azure',
      status: 'running',
      region: 'eastus',
      tags: { environment: 'development', team: 'engineering' },
      metadata: { vmSize: 'Standard_B2s', os: 'Ubuntu 22.04' },
      costPerMonth: 35.50,
      createdBy: user2.id,
    },
  ];

  for (const resource of resources) {
    await prisma.resource.create({ data: resource });
  }

  console.log('✅ Created demo resources');

  // Create demo API keys
  const apiKey = await prisma.apiKey.create({
    data: {
      organizationId: org1.id,
      name: 'Production API Key',
      description: 'API key for production integrations',
      keyHash: await bcrypt.hash('alm_prod_demo_key_12345', 10),
      keyPrefix: 'alm_prod_',
      scopes: ['resources:read', 'resources:write', 'providers:read'],
      status: 'active',
      createdBy: user1.id,
    },
  });

  console.log('✅ Created demo API keys');

  // Create audit log entry
  await prisma.auditLog.create({
    data: {
      organizationId: org1.id,
      userId: user1.id,
      action: 'organization.created',
      resource: 'Organization',
      resourceId: org1.id,
      details: { name: org1.name },
      status: 'success',
      ipAddress: '192.168.1.1',
      userAgent: 'Seed Script',
    },
  });

  console.log('✅ Created audit logs');

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📧 Demo Accounts:');
  console.log('   john@example.com / password123 (Owner @ Acme Corporation)');
  console.log('   jane@example.com / password123 (Admin @ Acme Corporation, Owner @ Startup Inc)');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
