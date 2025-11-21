#!/bin/bash

# Production Deployment Script for Almonds
# Handles safe deployment to production environment

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Almonds Production Deployment${NC}"
echo "================================"
echo ""

# Parse arguments
ENVIRONMENT=${1:-production}
SKIP_TESTS=${SKIP_TESTS:-false}
SKIP_BACKUP=${SKIP_BACKUP:-false}

echo -e "${BLUE}Configuration:${NC}"
echo "  Environment: $ENVIRONMENT"
echo "  Skip Tests: $SKIP_TESTS"
echo "  Skip Backup: $SKIP_BACKUP"
echo ""

# Confirm production deployment
if [ "$ENVIRONMENT" == "production" ]; then
    echo -e "${RED}⚠️  You are about to deploy to PRODUCTION${NC}"
    read -p "Are you sure? (yes/no) " -r
    echo
    if [ "$REPLY" != "yes" ]; then
        echo -e "${YELLOW}Deployment cancelled${NC}"
        exit 0
    fi
fi

# Check if environment file exists
ENV_FILE=".env.$ENVIRONMENT"
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ Environment file $ENV_FILE not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Environment file found${NC}"
echo ""

# Git status check
echo -e "${BLUE}📊 Checking Git status...${NC}"
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  You have uncommitted changes${NC}"
    git status --short
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
CURRENT_COMMIT=$(git rev-parse --short HEAD)
echo -e "${GREEN}✅ Current branch: $CURRENT_BRANCH ($CURRENT_COMMIT)${NC}"
echo ""

# Pull latest changes
echo -e "${BLUE}📥 Pulling latest changes...${NC}"
git pull origin $CURRENT_BRANCH
echo -e "${GREEN}✅ Code updated${NC}"
echo ""

# Install dependencies
echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm ci --production=false
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Run tests
if [ "$SKIP_TESTS" != "true" ]; then
    echo -e "${BLUE}🧪 Running tests...${NC}"
    npm test
    echo -e "${GREEN}✅ All tests passed${NC}"
    echo ""
else
    echo -e "${YELLOW}⚠️  Skipping tests${NC}"
    echo ""
fi

# Lint code
echo -e "${BLUE}🔍 Linting code...${NC}"
npm run lint
echo -e "${GREEN}✅ Code linting passed${NC}"
echo ""

# Backup database
if [ "$SKIP_BACKUP" != "true" ] && [ -f "./scripts/backup.sh" ]; then
    echo -e "${BLUE}💾 Creating database backup...${NC}"
    ./scripts/backup.sh
    echo -e "${GREEN}✅ Backup created${NC}"
    echo ""
else
    echo -e "${YELLOW}⚠️  Skipping database backup${NC}"
    echo ""
fi

# Build application
echo -e "${BLUE}🔨 Building application...${NC}"
npm run build
echo -e "${GREEN}✅ Build completed${NC}"
echo ""

# Run database migrations
echo -e "${BLUE}📋 Running database migrations...${NC}"
NODE_ENV=$ENVIRONMENT npx prisma migrate deploy
echo -e "${GREEN}✅ Migrations completed${NC}"
echo ""

# Generate Prisma Client
echo -e "${BLUE}🔄 Generating Prisma Client...${NC}"
npx prisma generate
echo -e "${GREEN}✅ Prisma Client generated${NC}"
echo ""

# Restart application (using PM2 or systemd)
echo -e "${BLUE}🔄 Restarting application...${NC}"

if command -v pm2 &> /dev/null; then
    # Using PM2
    if pm2 list | grep -q "almonds"; then
        pm2 restart almonds
    else
        pm2 start dist/main.js --name almonds
    fi
    echo -e "${GREEN}✅ Application restarted with PM2${NC}"
elif command -v systemctl &> /dev/null; then
    # Using systemd
    sudo systemctl restart almonds
    echo -e "${GREEN}✅ Application restarted with systemd${NC}"
else
    echo -e "${YELLOW}⚠️  No process manager found (PM2 or systemd)${NC}"
    echo "  Please restart the application manually"
fi

echo ""

# Health check
echo -e "${BLUE}🏥 Running health check...${NC}"
sleep 5  # Wait for app to start

if [ -f "./scripts/health-check.sh" ]; then
    ./scripts/health-check.sh
else
    # Simple health check
    API_URL="${API_URL:-http://localhost:3000}"
    if curl -sf "$API_URL/api/v1/health/live" > /dev/null; then
        echo -e "${GREEN}✅ Health check passed${NC}"
    else
        echo -e "${RED}❌ Health check failed${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo ""

# Deployment summary
echo -e "${BLUE}Deployment Summary:${NC}"
echo "  Environment: $ENVIRONMENT"
echo "  Branch: $CURRENT_BRANCH"
echo "  Commit: $CURRENT_COMMIT"
echo "  Timestamp: $(date)"
echo ""

# Rollback instructions
echo -e "${BLUE}Rollback Instructions:${NC}"
echo "  1. git checkout <previous-commit>"
echo "  2. ./scripts/deploy.sh $ENVIRONMENT"
echo "  3. Restore database: gunzip -c backups/latest.sql.gz | psql ..."
echo ""
