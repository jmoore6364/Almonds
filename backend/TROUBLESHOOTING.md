# Troubleshooting Guide

Comprehensive troubleshooting guide for the Almonds backend API.

## Table of Contents

- [Common Issues](#common-issues)
- [Database Problems](#database-problems)
- [Authentication Issues](#authentication-issues)
- [Performance Problems](#performance-problems)
- [Docker Issues](#docker-issues)
- [Deployment Problems](#deployment-problems)
- [Monitoring & Debugging](#monitoring--debugging)

## Common Issues

### API Won't Start

#### Symptom
```bash
npm run start:dev
# Error: Application failed to start
```

#### Possible Causes & Solutions

**1. Port Already in Use**
```bash
# Check what's using port 3000
lsof -i :3000
# or
netstat -an | grep 3000

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=3001 npm run start:dev
```

**2. Missing Environment Variables**
```bash
# Run environment check
npm run env:check

# Copy example file
cp .env.example .env

# Generate JWT secret
node scripts/generate-secret.js
```

**3. Database Connection Failed**
```bash
# Check database is running
docker ps | grep postgres

# Test connection
psql -h localhost -U almonds -d almonds

# Start database
docker-compose up -d postgres
```

### Module Not Found Errors

#### Symptom
```
Error: Cannot find module '@nestjs/...'
```

#### Solution
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Clear npm cache if issues persist
npm cache clean --force
npm install
```

### Prisma Client Issues

#### Symptom
```
Error: @prisma/client did not initialize yet
```

#### Solution
```bash
# Regenerate Prisma Client
npx prisma generate

# If schema changed, run migrations
npx prisma migrate dev

# Reset database (WARNING: destroys data)
npx prisma migrate reset
```

## Database Problems

### Cannot Connect to Database

#### Diagnostic Steps
```bash
# 1. Check DATABASE_URL in .env
cat .env | grep DATABASE_URL

# 2. Check if PostgreSQL is running
docker ps | grep postgres

# 3. Test connection
psql $DATABASE_URL

# 4. Check logs
docker logs almonds-postgres
```

#### Solutions

**Docker Container Not Running**
```bash
docker-compose up -d postgres
```

**Wrong Credentials**
```bash
# Update .env with correct credentials
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
```

**SSL Mode Issues**
```bash
# For local development
DATABASE_URL="postgresql://...?sslmode=disable"

# For production (always use SSL)
DATABASE_URL="postgresql://...?sslmode=require"
```

### Migration Failures

#### Symptom
```
Error: Migration failed to apply
```

#### Solutions

**1. Check Migration Status**
```bash
npx prisma migrate status
```

**2. Resolve Failed Migration**
```bash
# Mark migration as applied (if applied manually)
npx prisma migrate resolve --applied "migration_name"

# Or mark as rolled back
npx prisma migrate resolve --rolled-back "migration_name"
```

**3. Reset Database (Development Only)**
```bash
npx prisma migrate reset --skip-seed
npx prisma migrate dev
```

**4. Manual Migration**
```bash
# Apply SQL manually
psql $DATABASE_URL < prisma/migrations/xxx_migration.sql
```

### Slow Database Queries

#### Diagnostic
```bash
# Enable query logging in .env
DATABASE_LOGGING=true

# Or check with Prisma Studio
npx prisma studio
```

#### Solutions

**1. Add Indexes**
```prisma
model User {
  email String @unique
  @@index([email])  // Add index
}
```

**2. Optimize Queries**
```typescript
// ❌ Bad: N+1 queries
const users = await prisma.user.findMany();
for (const user of users) {
  const org = await prisma.organization.findUnique({ where: { id: user.orgId } });
}

// ✅ Good: Single query with includes
const users = await prisma.user.findMany({
  include: { organization: true }
});
```

**3. Use Connection Pooling**
```env
DATABASE_URL="postgresql://...?connection_limit=10"
```

## Authentication Issues

### JWT Token Expired

#### Symptom
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

#### Solutions

**1. Refresh Token**
```bash
POST /api/v1/auth/refresh
{
  "refresh_token": "..."
}
```

**2. Check Token Expiration**
```env
JWT_EXPIRES_IN="7d"  # Increase if needed
```

**3. Clear Old Tokens**
```typescript
// Client-side: Clear localStorage
localStorage.removeItem('access_token');
```

### OAuth Not Working

#### Google OAuth Issues

**1. Callback URL Mismatch**
```bash
# Check .env matches Google Console
GOOGLE_CALLBACK_URL="http://localhost:3000/api/v1/auth/google/callback"
```

**2. Invalid Credentials**
```bash
# Verify credentials in Google Console
# Ensure OAuth consent screen is configured
```

**3. CORS Issues**
```typescript
// Check CORS configuration in main.ts
app.enableCors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
});
```

### 2FA Problems

#### Cannot Generate QR Code

**Solution**
```bash
# Check speakeasy and qrcode packages
npm install speakeasy qrcode
```

#### 2FA Code Not Working

**Causes**
- Time sync issues between server and authenticator app
- Wrong secret used

**Solution**
```typescript
// Increase time window
speakeasy.totp.verify({
  secret: user.twoFactorSecret,
  encoding: 'base32',
  token: code,
  window: 2  // Allows ±2 time steps (60 seconds)
});
```

## Performance Problems

### High Memory Usage

#### Diagnostic
```bash
# Monitor memory
node --inspect dist/main.js

# Check heap snapshots
# Open Chrome DevTools: chrome://inspect
```

#### Solutions

**1. Increase Memory Limit**
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run start:dev
```

**2. Check for Memory Leaks**
```typescript
// ❌ Bad: Memory leak
let cache = [];
export function addToCache(item) {
  cache.push(item);  // Never cleared!
}

// ✅ Good: Limited cache
import LRU from 'lru-cache';
const cache = new LRU({ max: 100 });
```

**3. Enable Garbage Collection Logs**
```bash
node --trace-gc dist/main.js
```

### High CPU Usage

#### Diagnostic
```bash
# Use clinic.js for profiling
npm install -g clinic
clinic doctor -- node dist/main.js

# Or use built-in profiler
node --prof dist/main.js
node --prof-process isolate-*.log
```

#### Solutions

**1. Optimize Heavy Operations**
```typescript
// ❌ Bad: Synchronous heavy operation
const data = JSON.parse(largeString);

// ✅ Good: Async or streaming
const data = await parseJSONStream(stream);
```

**2. Use Worker Threads**
```typescript
import { Worker } from 'worker_threads';

// Offload CPU-intensive tasks
const worker = new Worker('./heavy-task.js');
```

**3. Add Rate Limiting**
```typescript
// Prevent abuse
@Throttle({ default: { limit: 10, ttl: 60000 } })
```

### Slow API Responses

#### Diagnostic
```bash
# Check with curl
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3000/api/v1/health

# Create curl-format.txt:
time_namelookup:  %{time_namelookup}s
time_connect:     %{time_connect}s
time_appconnect:  %{time_appconnect}s
time_pretransfer: %{time_pretransfer}s
time_starttransfer: %{time_starttransfer}s
time_total:       %{time_total}s
```

#### Solutions

**1. Add Caching**
```typescript
import { CacheInterceptor } from '@nestjs/cache-manager';

@UseInterceptors(CacheInterceptor)
@Get()
async findAll() {
  // Cached for TTL period
}
```

**2. Optimize Database Queries**
```typescript
// Use select to limit fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    // Don't fetch large fields if not needed
  }
});
```

**3. Add Pagination**
```typescript
async findAll(page: number = 1, limit: number = 20) {
  return await prisma.resource.findMany({
    skip: (page - 1) * limit,
    take: limit,
  });
}
```

## Docker Issues

### Container Won't Start

#### Diagnostic
```bash
# Check logs
docker logs almonds-api

# Check container status
docker ps -a

# Inspect container
docker inspect almonds-api
```

#### Solutions

**1. Port Conflicts**
```bash
# Change port in docker-compose.yml
ports:
  - "3001:3000"
```

**2. Volume Permission Issues**
```bash
# Fix permissions
sudo chown -R $USER:$USER ./data
```

**3. Network Issues**
```bash
# Recreate network
docker-compose down
docker network prune
docker-compose up
```

### Database Connection Issues in Docker

#### Solution
```yaml
# Use service name as host
DATABASE_URL="postgresql://almonds:almonds@postgres:5432/almonds"

# Ensure services are on same network
networks:
  - almonds-network
```

## Deployment Problems

### Health Checks Failing

#### Diagnostic
```bash
# Test health endpoints
curl http://localhost:3000/api/v1/health/live
curl http://localhost:3000/api/v1/health/ready
curl http://localhost:3000/api/v1/health
```

#### Solutions

**1. Database Not Ready**
```bash
# Add depends_on in docker-compose.yml
depends_on:
  postgres:
    condition: service_healthy
```

**2. Timeout Too Short**
```yaml
# Increase health check timeout
healthcheck:
  timeout: 10s
  interval: 30s
```

### Build Failures

#### TypeScript Errors
```bash
# Clean build
rm -rf dist
npm run build

# Check TypeScript config
npx tsc --noEmit
```

#### Missing Dependencies
```bash
# Install production dependencies
npm ci --production

# Or include all dependencies
npm ci
```

### Environment Variables Not Working

#### Solution
```bash
# Check if .env is loaded
echo $JWT_SECRET

# Explicitly load .env
export $(cat .env | grep -v '^#' | xargs)

# Or use cross-env
npm install --save-dev cross-env
cross-env NODE_ENV=production npm start
```

## Monitoring & Debugging

### Enable Debug Logging

```env
# .env
LOG_LEVEL="debug"
DATABASE_LOGGING=true
```

### Use Debugging Tools

**1. NestJS Built-in Debugger**
```bash
npm run start:debug

# Attach debugger
# VS Code: F5 or use launch.json
```

**2. Chrome DevTools**
```bash
node --inspect dist/main.js
# Open chrome://inspect
```

**3. Network Debugging**
```bash
# Monitor HTTP requests
npm install -g http-proxy-middleware

# Or use Charles/Proxyman
```

### Check System Resources

```bash
# Memory and CPU
htop

# Disk space
df -h

# Network connections
netstat -an | grep ESTABLISHED

# Docker stats
docker stats
```

## Getting Help

### Collect Diagnostic Information

Before asking for help, collect:

```bash
# System info
uname -a
node -v
npm -v
docker -v

# Application logs
docker logs almonds-api > logs.txt

# Database status
docker exec almonds-postgres pg_isready

# Environment (redact secrets!)
cat .env | grep -v SECRET | grep -v KEY

# Package versions
npm list --depth=0
```

### Resources

- **Documentation**: [README.md](../README.md)
- **API Reference**: [API.md](API.md)
- **GitHub Issues**: https://github.com/almonds/almonds/issues
- **Discord**: #support channel
- **Email**: support@almonds.io

---

**Still having issues?** Open a GitHub issue with:
1. Description of the problem
2. Steps to reproduce
3. Expected vs actual behavior
4. Environment details
5. Relevant logs
