# Deployment Guide - Almonds Backend API

This guide covers deploying the Almonds backend API to production.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Deployment Options](#deployment-options)
5. [Post-Deployment](#post-deployment)
6. [Monitoring](#monitoring)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Services
- **Database**: PostgreSQL 15+ (managed service recommended)
  - AWS RDS, Google Cloud SQL, or Supabase
- **Redis**: Redis 7+ for job queues and caching
  - AWS ElastiCache, Redis Cloud, or Upstash
- **Email**: SendGrid account for transactional emails
- **Payments**: Stripe account for billing

### Required Accounts
- Docker Hub (for Docker deployments)
- Cloud provider account (AWS, GCP, Azure, or DigitalOcean)
- Domain name and SSL certificate

## Environment Setup

### 1. Clone and Configure

```bash
# Clone the repository
git clone https://github.com/yourusername/almonds.git
cd almonds/backend

# Copy production environment template
cp .env.production.example .env.production

# Generate secure secrets
npm run env:generate-secret
```

### 2. Configure Environment Variables

Edit `.env.production` with your actual credentials:

**Required Variables:**
```bash
# Database
DATABASE_URL="postgresql://user:pass@host:5432/almonds?sslmode=require"

# Application
NODE_ENV=production
JWT_SECRET=<generated-secret>
ENCRYPTION_KEY=<generated-secret>

# External Services
STRIPE_SECRET_KEY=sk_live_...
SENDGRID_API_KEY=SG....
REDIS_HOST=your-redis-host
REDIS_PASSWORD=your-redis-password

# URLs
FRONTEND_URL=https://app.almonds.io
CORS_ORIGIN=https://app.almonds.io
```

### 3. Validate Configuration

```bash
# Check all required environment variables are set
npm run env:check
```

## Database Setup

### 1. Create Database

```bash
# On your PostgreSQL server
createdb almonds
```

### 2. Run Migrations

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate:deploy

# (Optional) Seed with demo data for testing
npm run prisma:seed
```

### 3. Verify Database

```bash
# Open Prisma Studio to verify tables
npm run prisma:studio
```

## Deployment Options

### Option 1: Docker Compose (Recommended for VPS)

**Best for**: DigitalOcean Droplets, Linode, AWS EC2

```bash
# Build and start all services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f api

# Check health
curl http://localhost:3000/api/v1/health
```

**Benefits:**
- Easy to deploy and manage
- Includes PostgreSQL, Redis, and Nginx
- Automatic restarts and health checks

### Option 2: Kubernetes (Recommended for Scale)

**Best for**: AWS EKS, Google GKE, Azure AKS

```bash
# Create namespace
kubectl create namespace almonds

# Create secrets
kubectl create secret generic almonds-secrets \
  --from-literal=database-url=$DATABASE_URL \
  --from-literal=jwt-secret=$JWT_SECRET \
  --from-literal=stripe-secret-key=$STRIPE_SECRET_KEY \
  --from-literal=sendgrid-api-key=$SENDGRID_API_KEY \
  -n almonds

# Deploy application
kubectl apply -f k8s/deployment.yaml -n almonds

# Check status
kubectl get pods -n almonds
kubectl get svc -n almonds

# View logs
kubectl logs -f deployment/almonds-api -n almonds
```

**Benefits:**
- Auto-scaling (3-10 replicas)
- Zero-downtime deployments
- Built-in load balancing
- Production-grade reliability

### Option 3: Platform as a Service

**Railway:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and link project
railway login
railway link

# Deploy
railway up
```

**Render:**
```bash
# Connect GitHub repo to Render
# Set environment variables in dashboard
# Deploy automatically on push
```

**Heroku:**
```bash
# Install Heroku CLI
heroku login

# Create app
heroku create almonds-api

# Add PostgreSQL and Redis
heroku addons:create heroku-postgresql:standard-0
heroku addons:create heroku-redis:premium-0

# Deploy
git push heroku main
```

### Option 4: Traditional VPS

**For**: Ubuntu 22.04 LTS server

```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Install PM2
sudo npm install -g pm2

# 4. Clone and setup
git clone https://github.com/yourusername/almonds.git
cd almonds/backend
npm ci --only=production

# 5. Build application
npm run build

# 6. Start with PM2
pm2 start dist/main.js --name almonds-api -i max
pm2 save
pm2 startup

# 7. Setup Nginx reverse proxy
sudo apt install nginx
sudo cp nginx.conf /etc/nginx/sites-available/almonds
sudo ln -s /etc/nginx/sites-available/almonds /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## Post-Deployment

### 1. Verify Deployment

```bash
# Check health
curl https://api.almonds.io/api/v1/health

# Check API documentation
open https://api.almonds.io/api/docs

# Test authentication
curl -X POST https://api.almonds.io/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test","password":"password123"}'
```

### 2. Configure Stripe Webhooks

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://api.almonds.io/api/v1/billing/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

### 3. Configure DNS

```
# A Record
api.almonds.io → Your server IP

# Or CNAME (if using load balancer)
api.almonds.io → your-load-balancer.amazonaws.com
```

### 4. SSL Certificate

**Let's Encrypt (Free):**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.almonds.io
```

## Monitoring

### Application Monitoring

```bash
# View logs (Docker)
docker logs -f almonds-api-prod

# View logs (PM2)
pm2 logs almonds-api

# View logs (Kubernetes)
kubectl logs -f deployment/almonds-api -n almonds
```

### Health Checks

- **Liveness**: `GET /api/v1/health/live` - Is the service running?
- **Readiness**: `GET /api/v1/health/ready` - Can it serve traffic?
- **Full Health**: `GET /api/v1/health` - Detailed system health

### Metrics to Monitor

- Response times (should be < 200ms)
- Error rates (should be < 1%)
- CPU usage (should be < 70%)
- Memory usage (should be < 80%)
- Database connections
- API request count

### Recommended Tools

- **Application Performance**: Sentry, DataDog, New Relic
- **Infrastructure**: Prometheus + Grafana
- **Logs**: ELK Stack, Papertrail, Logtail
- **Uptime**: UptimeRobot, Pingdom

## Troubleshooting

### Common Issues

**Database Connection Failed:**
```bash
# Check DATABASE_URL format
echo $DATABASE_URL

# Test connection
npx prisma db execute --sql "SELECT 1"

# Verify SSL mode if using managed DB
DATABASE_URL="...?sslmode=require"
```

**Application Won't Start:**
```bash
# Check environment variables
npm run env:check

# Verify all dependencies installed
npm ci

# Check logs for errors
pm2 logs almonds-api --lines 100
```

**High Memory Usage:**
```bash
# Check for memory leaks
pm2 monit

# Restart application
pm2 restart almonds-api

# Increase memory limit (Kubernetes)
# Edit resources.limits.memory in deployment.yaml
```

**Slow Response Times:**
```bash
# Check database query performance
# Enable Prisma query logging in production temporarily

# Check Redis connection
redis-cli ping

# Review slow queries in database
```

## Rollback

### Docker:
```bash
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
```

### Kubernetes:
```bash
kubectl rollout undo deployment/almonds-api -n almonds
```

### PM2:
```bash
git checkout previous-commit
npm ci && npm run build
pm2 restart almonds-api
```

## Security Checklist

- [ ] All environment variables use secure, random values
- [ ] Database uses SSL/TLS connections
- [ ] API only accessible via HTTPS
- [ ] CORS configured for frontend domain only
- [ ] Rate limiting enabled
- [ ] Security headers configured (Helmet.js)
- [ ] Secrets stored in secret manager (not .env files)
- [ ] Regular backups configured
- [ ] Monitoring and alerting set up
- [ ] Firewall configured (only ports 80, 443, 22 open)

## Support

For deployment help:
- Documentation: https://docs.almonds.io
- GitHub Issues: https://github.com/yourusername/almonds/issues
- Email: support@almonds.io
