# Performance Optimization Guide

Comprehensive guide for optimizing the Almonds backend API for production workloads.

## Table of Contents

- [Overview](#overview)
- [Performance Targets](#performance-targets)
- [Database Optimization](#database-optimization)
- [Caching Strategies](#caching-strategies)
- [API Optimization](#api-optimization)
- [Node.js Optimization](#nodejs-optimization)
- [Network Optimization](#network-optimization)
- [Monitoring & Profiling](#monitoring--profiling)
- [Load Testing](#load-testing)
- [Production Checklist](#production-checklist)

## Overview

This guide provides battle-tested strategies for optimizing the Almonds API to handle thousands of concurrent requests with sub-second response times.

### Key Metrics

- **Response Time**: p95 < 500ms, p99 < 1000ms
- **Throughput**: 1000+ requests/second per instance
- **Error Rate**: < 0.1%
- **Availability**: 99.95% uptime

## Performance Targets

### Response Time Goals

| Endpoint Type | p50 | p95 | p99 |
|--------------|-----|-----|-----|
| Simple GET | < 50ms | < 100ms | < 200ms |
| Complex GET | < 150ms | < 300ms | < 500ms |
| POST/PUT | < 200ms | < 500ms | < 1000ms |
| Search/Filter | < 300ms | < 600ms | < 1200ms |

### Resource Usage

| Resource | Target | Warning | Critical |
|----------|--------|---------|----------|
| CPU | < 70% | > 70% | > 90% |
| Memory | < 80% | > 80% | > 95% |
| Database Connections | < 70% of pool | > 80% | > 95% |
| Redis Memory | < 70% | > 80% | > 90% |

## Database Optimization

### 1. Connection Pooling

Configure Prisma connection pool for optimal performance:

```typescript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")

  // Connection pool configuration
  shadowDatabaseUrl = env("SHADOW_DATABASE_URL")
}

// In your database configuration
const DATABASE_URL = "postgresql://user:password@host:5432/db" +
  "?schema=public" +
  "&connection_limit=20" +      // Connections per instance
  "&pool_timeout=10" +           // Connection acquisition timeout (seconds)
  "&connect_timeout=10";         // Initial connection timeout (seconds)
```

**Pool Size Calculation:**
```
Optimal Pool Size = ((core_count × 2) + effective_spindle_count)

For typical web app:
- 4 CPU cores
- Pool size = (4 × 2) + 1 = 9-10 connections per instance
- With 3 instances: 30 total connections
```

### 2. Query Optimization

#### Use Selective Fields

```typescript
// ❌ Bad: Fetches all fields
const users = await prisma.user.findMany();

// ✅ Good: Only fetch needed fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    name: true,
  },
});
```

#### Avoid N+1 Queries

```typescript
// ❌ Bad: N+1 query problem
const users = await prisma.user.findMany();
for (const user of users) {
  const org = await prisma.organization.findUnique({
    where: { id: user.organizationId },
  });
  // Process org...
}

// ✅ Good: Single query with include
const users = await prisma.user.findMany({
  include: {
    organization: true,
  },
});
```

#### Use Pagination

```typescript
// ❌ Bad: Fetch all records
const resources = await prisma.resource.findMany();

// ✅ Good: Paginated results
const resources = await prisma.resource.findMany({
  skip: (page - 1) * limit,
  take: limit,
  orderBy: { createdAt: 'desc' },
});
```

### 3. Database Indexes

Add indexes for frequently queried fields:

```prisma
model User {
  id             String   @id @default(uuid())
  email          String   @unique
  organizationId String

  // Add indexes for performance
  @@index([organizationId])
  @@index([email])
  @@index([createdAt])
}

model Resource {
  id             String   @id @default(uuid())
  organizationId String
  type           String
  status         String
  createdAt      DateTime @default(now())

  @@index([organizationId, type])
  @@index([status, createdAt])
  @@index([organizationId, status, type])
}
```

**Index Guidelines:**
- Index foreign keys
- Index fields used in WHERE clauses
- Create composite indexes for multi-field queries
- Avoid over-indexing (slows down writes)

### 4. Query Analysis

Use `EXPLAIN ANALYZE` to identify slow queries:

```sql
-- Enable query logging
ALTER DATABASE almonds SET log_statement = 'all';
ALTER DATABASE almonds SET log_min_duration_statement = 1000; -- Log queries > 1s

-- Analyze a query
EXPLAIN ANALYZE
SELECT * FROM "User"
WHERE "organizationId" = 'org-123'
  AND "status" = 'active'
ORDER BY "createdAt" DESC
LIMIT 20;
```

### 5. Database-Level Optimizations

```sql
-- Increase shared buffers (25% of RAM)
ALTER SYSTEM SET shared_buffers = '2GB';

-- Increase work memory for complex queries
ALTER SYSTEM SET work_mem = '64MB';

-- Increase maintenance work memory
ALTER SYSTEM SET maintenance_work_mem = '512MB';

-- Enable query planner statistics
ALTER SYSTEM SET random_page_cost = 1.1; -- For SSD storage

-- Reload configuration
SELECT pg_reload_conf();
```

## Caching Strategies

### 1. Application-Level Caching

Implement caching using Redis and NestJS Cache Manager:

```typescript
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';

// app.module.ts
@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => ({
        store: await redisStore({
          socket: {
            host: process.env.REDIS_HOST,
            port: parseInt(process.env.REDIS_PORT),
          },
          password: process.env.REDIS_PASSWORD,
          ttl: 300, // Default TTL: 5 minutes
        }),
      }),
    }),
  ],
})
export class AppModule {}
```

### 2. Endpoint-Level Caching

```typescript
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';

@Controller('organizations')
@UseInterceptors(CacheInterceptor)
export class OrganizationsController {
  // Cache for 5 minutes (default)
  @Get()
  async findAll() {
    return this.organizationsService.findAll();
  }

  // Custom TTL: 1 hour
  @Get(':id')
  @CacheTTL(3600)
  async findOne(@Param('id') id: string) {
    return this.organizationsService.findOne(id);
  }

  // No caching for mutations
  @Post()
  async create(@Body() dto: CreateOrganizationDto) {
    // Invalidate cache on write
    await this.cacheManager.reset();
    return this.organizationsService.create(dto);
  }
}
```

### 3. Cache Invalidation

```typescript
import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class ResourcesService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private prisma: PrismaService,
  ) {}

  async create(dto: CreateResourceDto) {
    const resource = await this.prisma.resource.create({ data: dto });

    // Invalidate specific cache keys
    await this.cacheManager.del(`resources:org:${dto.organizationId}`);
    await this.cacheManager.del(`resources:list`);

    return resource;
  }

  async findByOrganization(organizationId: string) {
    const cacheKey = `resources:org:${organizationId}`;

    // Try cache first
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    // Query database
    const resources = await this.prisma.resource.findMany({
      where: { organizationId },
    });

    // Store in cache (1 hour)
    await this.cacheManager.set(cacheKey, resources, 3600);

    return resources;
  }
}
```

### 4. Caching Strategy Matrix

| Data Type | Cache Duration | Invalidation Strategy |
|-----------|----------------|----------------------|
| User profile | 1 hour | On update |
| Organization details | 1 hour | On update |
| Resource list | 5 minutes | On create/update/delete |
| Public API responses | 15 minutes | Time-based |
| Aggregated stats | 1 hour | On data change |
| Search results | 10 minutes | Time-based |

### 5. Cache Warming

Pre-populate cache for frequently accessed data:

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';

@Injectable()
export class CacheWarmingService implements OnModuleInit {
  constructor(
    private organizationsService: OrganizationsService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async onModuleInit() {
    // Warm cache on startup
    await this.warmOrganizationsCache();
  }

  private async warmOrganizationsCache() {
    const orgs = await this.organizationsService.findMostActive(100);

    for (const org of orgs) {
      const cacheKey = `org:${org.id}`;
      await this.cacheManager.set(cacheKey, org, 3600);
    }

    console.log(`Warmed cache with ${orgs.length} organizations`);
  }
}
```

## API Optimization

### 1. Response Compression

Enable gzip compression:

```typescript
// main.ts
import compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable compression
  app.use(compression({
    threshold: 1024, // Only compress responses > 1KB
    level: 6,        // Compression level (0-9)
  }));

  await app.listen(3000);
}
```

### 2. Rate Limiting

Prevent abuse and ensure fair resource usage:

```typescript
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,  // 1 minute
        limit: 100,  // 100 requests per minute
      },
    ]),
  ],
})
export class AppModule {}

// Per-endpoint overrides
@Controller('search')
export class SearchController {
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Get()
  async search(@Query() query: SearchDto) {
    // Expensive search operation
  }
}
```

### 3. Pagination Standards

Implement cursor-based pagination for large datasets:

```typescript
interface PaginationQuery {
  limit?: number;
  cursor?: string;
}

async findAllPaginated(query: PaginationQuery) {
  const limit = Math.min(query.limit || 20, 100); // Max 100 items

  const resources = await this.prisma.resource.findMany({
    take: limit + 1, // Fetch one extra to check if there's more
    cursor: query.cursor ? { id: query.cursor } : undefined,
    orderBy: { createdAt: 'desc' },
  });

  const hasMore = resources.length > limit;
  const items = hasMore ? resources.slice(0, -1) : resources;

  return {
    items,
    pagination: {
      cursor: items[items.length - 1]?.id,
      hasMore,
      limit,
    },
  };
}
```

### 4. Field Selection

Allow clients to specify needed fields:

```typescript
@Get()
async findAll(@Query('fields') fields?: string) {
  const selectedFields = fields ? fields.split(',') : undefined;

  const select = selectedFields?.reduce((acc, field) => {
    acc[field] = true;
    return acc;
  }, {});

  return this.prisma.resource.findMany({
    select: select || {
      id: true,
      name: true,
      type: true,
      status: true,
    },
  });
}

// Usage: GET /resources?fields=id,name,type
```

### 5. Async Processing

Offload heavy operations to background jobs:

```typescript
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

@Injectable()
export class ResourcesService {
  constructor(
    @InjectQueue('resources') private resourcesQueue: Queue,
  ) {}

  async createResource(dto: CreateResourceDto) {
    // Quick validation
    const resource = await this.prisma.resource.create({
      data: { ...dto, status: 'pending' },
    });

    // Queue heavy provisioning work
    await this.resourcesQueue.add('provision', {
      resourceId: resource.id,
    });

    // Return immediately
    return resource;
  }
}

// Process in background
@Processor('resources')
export class ResourcesProcessor {
  @Process('provision')
  async handleProvisioning(job: Job<{ resourceId: string }>) {
    // Heavy provisioning logic here
    await this.provisionResource(job.data.resourceId);
  }
}
```

## Node.js Optimization

### 1. Event Loop Monitoring

```typescript
import { performance } from 'perf_hooks';

// Monitor event loop lag
setInterval(() => {
  const start = performance.now();
  setImmediate(() => {
    const lag = performance.now() - start;
    if (lag > 100) {
      console.warn(`Event loop lag: ${lag.toFixed(2)}ms`);
    }
  });
}, 5000);
```

### 2. Memory Management

```typescript
// Set memory limits
const memoryLimit = process.env.NODE_OPTIONS || '--max-old-space-size=2048';

// Monitor memory usage
setInterval(() => {
  const usage = process.memoryUsage();
  const heapUsedMB = (usage.heapUsed / 1024 / 1024).toFixed(2);
  const heapTotalMB = (usage.heapTotal / 1024 / 1024).toFixed(2);

  console.log(`Heap: ${heapUsedMB}MB / ${heapTotalMB}MB`);

  if (usage.heapUsed / usage.heapTotal > 0.9) {
    console.warn('High memory usage detected');
  }
}, 60000);
```

### 3. Cluster Mode

Use PM2 for multi-process deployment:

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'almonds-api',
    script: './dist/main.js',
    instances: 'max', // Use all CPU cores
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
    },
    max_memory_restart: '1G',
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
  }],
};
```

### 4. Optimize JSON Parsing

Use fast-json-stringify for serialization:

```typescript
import fastJson from 'fast-json-stringify';

const stringify = fastJson({
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    email: { type: 'string' },
    createdAt: { type: 'string' },
  },
});

// 2-3x faster than JSON.stringify
const json = stringify(user);
```

### 5. Avoid Synchronous Operations

```typescript
// ❌ Bad: Blocking operations
const data = fs.readFileSync('large-file.json');
const parsed = JSON.parse(data);

// ✅ Good: Async operations
const data = await fs.promises.readFile('large-file.json', 'utf-8');
const parsed = JSON.parse(data);

// ✅ Even better: Streaming for large files
const stream = fs.createReadStream('large-file.json');
const parsed = await parseJSONStream(stream);
```

## Network Optimization

### 1. HTTP/2 Support

Enable HTTP/2 for better performance:

```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as fs from 'fs';

async function bootstrap() {
  const httpsOptions = {
    key: fs.readFileSync('./secrets/private-key.pem'),
    cert: fs.readFileSync('./secrets/certificate.pem'),
  };

  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    { httpsOptions },
  );

  await app.listen(3000);
}
```

### 2. CDN Integration

Serve static assets via CDN:

```typescript
// Serve from CDN
const STATIC_ASSETS_URL = process.env.CDN_URL || 'https://cdn.almonds.io';

@Get('avatar')
async getAvatar(@Param('id') id: string) {
  return {
    url: `${STATIC_ASSETS_URL}/avatars/${id}.jpg`,
  };
}
```

### 3. Connection Keep-Alive

```typescript
import { HttpService } from '@nestjs/axios';
import { Agent } from 'https';

@Module({
  providers: [
    {
      provide: HttpService,
      useFactory: () => {
        return new HttpService({
          httpsAgent: new Agent({
            keepAlive: true,
            keepAliveMsecs: 30000,
            maxSockets: 100,
            maxFreeSockets: 10,
          }),
        });
      },
    },
  ],
})
export class AppModule {}
```

### 4. Request Batching

Batch multiple requests into one:

```typescript
@Post('batch')
async batchRequest(@Body() requests: BatchRequest[]) {
  const results = await Promise.all(
    requests.map(req => this.processRequest(req))
  );

  return { results };
}

// Client usage:
// POST /batch
// [
//   { method: 'GET', path: '/resources/1' },
//   { method: 'GET', path: '/organizations/2' },
// ]
```

## Monitoring & Profiling

### 1. Performance Metrics

```typescript
import { Injectable } from '@nestjs/common';
import { performance } from 'perf_hooks';

@Injectable()
export class MetricsService {
  private readonly metrics = {
    requestCount: 0,
    requestDuration: [] as number[],
    errorCount: 0,
  };

  recordRequest(duration: number) {
    this.metrics.requestCount++;
    this.metrics.requestDuration.push(duration);

    // Keep only last 1000 requests
    if (this.metrics.requestDuration.length > 1000) {
      this.metrics.requestDuration.shift();
    }
  }

  getMetrics() {
    const durations = this.metrics.requestDuration.sort((a, b) => a - b);
    const p50 = durations[Math.floor(durations.length * 0.5)];
    const p95 = durations[Math.floor(durations.length * 0.95)];
    const p99 = durations[Math.floor(durations.length * 0.99)];

    return {
      totalRequests: this.metrics.requestCount,
      errorCount: this.metrics.errorCount,
      p50,
      p95,
      p99,
    };
  }
}
```

### 2. Request Timing Middleware

```typescript
@Injectable()
export class TimingMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const start = performance.now();

    res.on('finish', () => {
      const duration = performance.now() - start;
      res.setHeader('X-Response-Time', `${duration.toFixed(2)}ms`);

      if (duration > 1000) {
        console.warn(`Slow request: ${req.method} ${req.path} (${duration.toFixed(2)}ms)`);
      }
    });

    next();
  }
}
```

### 3. Database Query Profiling

```typescript
// Enable Prisma query logging
const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' },
  ],
});

prisma.$on('query', (e) => {
  if (e.duration > 1000) {
    console.warn(`Slow query (${e.duration}ms): ${e.query}`);
  }
});
```

### 4. APM Integration

```typescript
// New Relic
import newrelic from 'newrelic';

@Injectable()
export class AppService {
  async slowOperation() {
    return newrelic.startSegment('slowOperation', true, async () => {
      // Operation code
    });
  }
}

// Datadog
import tracer from 'dd-trace';
tracer.init({
  service: 'almonds-api',
  env: 'production',
});
```

## Load Testing

### Run Load Tests

```bash
# Install k6
brew install k6  # macOS
# or
curl https://github.com/grafana/k6/releases/download/v0.47.0/k6-v0.47.0-linux-amd64.tar.gz -L | tar xvz

# Run load test
cd load-tests
./run-load-test.sh

# Or run directly
k6 run load-test.js
```

### Analyze Results

```bash
# Generate HTML report
k6 run --out json=results.json load-test.js
k6-to-html results.json -o report.html

# Key metrics to check:
# - http_req_duration: p95 < 500ms
# - http_req_failed: < 1%
# - http_reqs: > 1000/s
```

## Production Checklist

### Performance

- [ ] Database connection pooling configured
- [ ] Indexes added for all queried fields
- [ ] N+1 queries eliminated
- [ ] Pagination implemented for list endpoints
- [ ] Caching strategy implemented
- [ ] Rate limiting configured
- [ ] Response compression enabled
- [ ] Static assets served from CDN
- [ ] Async processing for heavy operations
- [ ] HTTP/2 enabled

### Monitoring

- [ ] Application metrics exposed
- [ ] Database query logging enabled
- [ ] Error tracking configured (Sentry)
- [ ] Performance monitoring (APM)
- [ ] Resource usage monitoring
- [ ] Alert rules configured
- [ ] Uptime monitoring
- [ ] Log aggregation

### Optimization

- [ ] Load testing completed
- [ ] Bottlenecks identified and fixed
- [ ] Memory leaks checked
- [ ] Event loop lag monitored
- [ ] Database queries optimized
- [ ] Cache hit rate > 80%
- [ ] Error rate < 0.1%
- [ ] p95 response time < 500ms

---

**Last Updated**: 2024-01-01
**Maintained By**: Almonds Performance Team
