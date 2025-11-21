#!/bin/bash

# Almonds Backend Setup Script
# This script sets up the development environment

set -e  # Exit on error

echo "🌰 Almonds Backend Setup"
echo "======================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Node.js is installed
echo -e "${BLUE}📦 Checking prerequisites...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version 18+ is required. Current version: $(node -v)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node -v) found${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ npm $(npm -v) found${NC}"

# Check if Docker is installed (optional but recommended)
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✅ Docker $(docker -v | cut -d' ' -f3 | cut -d',' -f1) found${NC}"
else
    echo -e "${YELLOW}⚠️  Docker not found (optional but recommended)${NC}"
fi

echo ""

# Install dependencies
echo -e "${BLUE}📥 Installing dependencies...${NC}"
npm install
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Setup environment file
echo -e "${BLUE}⚙️  Setting up environment...${NC}"
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${GREEN}✅ Created .env file from .env.example${NC}"
        echo -e "${YELLOW}⚠️  Please update .env with your configuration${NC}"
    else
        echo -e "${RED}❌ .env.example not found${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  .env already exists, skipping...${NC}"
fi

# Generate JWT secret if not set
if ! grep -q "^JWT_SECRET=.\{32,\}" .env; then
    echo -e "${BLUE}🔐 Generating JWT secret...${NC}"
    JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    if grep -q "^JWT_SECRET=" .env; then
        # Update existing JWT_SECRET
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s|^JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" .env
        else
            # Linux
            sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" .env
        fi
    else
        # Add JWT_SECRET
        echo "JWT_SECRET=$JWT_SECRET" >> .env
    fi
    echo -e "${GREEN}✅ JWT secret generated${NC}"
fi

echo ""

# Check database connection
echo -e "${BLUE}🗄️  Checking database...${NC}"
if grep -q "^DATABASE_URL=" .env; then
    echo -e "${GREEN}✅ Database URL configured${NC}"

    # Ask if user wants to start Docker services
    echo ""
    read -p "Start database with Docker Compose? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if command -v docker-compose &> /dev/null || command -v docker &> /dev/null; then
            echo -e "${BLUE}🐳 Starting Docker services...${NC}"
            docker-compose up -d
            echo -e "${GREEN}✅ Docker services started${NC}"

            # Wait for database to be ready
            echo -e "${BLUE}⏳ Waiting for database to be ready...${NC}"
            sleep 5
        else
            echo -e "${RED}❌ Docker or docker-compose not found${NC}"
        fi
    fi
else
    echo -e "${YELLOW}⚠️  DATABASE_URL not configured in .env${NC}"
fi

echo ""

# Run migrations
echo -e "${BLUE}📋 Running database migrations...${NC}"
read -p "Run Prisma migrations? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npx prisma migrate deploy
    echo -e "${GREEN}✅ Migrations completed${NC}"

    # Generate Prisma Client
    echo -e "${BLUE}🔄 Generating Prisma Client...${NC}"
    npx prisma generate
    echo -e "${GREEN}✅ Prisma Client generated${NC}"
fi

echo ""

# Seed database
echo -e "${BLUE}🌱 Seeding database...${NC}"
read -p "Seed database with demo data? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm run prisma:seed
    echo -e "${GREEN}✅ Database seeded${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Setup complete!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "  1. Update .env with your configuration"
echo "  2. Start the development server: npm run start:dev"
echo "  3. View API docs: http://localhost:3000/api/docs"
echo ""
echo -e "${BLUE}Useful commands:${NC}"
echo "  npm run start:dev     - Start development server"
echo "  npm test              - Run tests"
echo "  npm run lint          - Lint code"
echo "  npx prisma studio     - Open database GUI"
echo ""
