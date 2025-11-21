#!/bin/bash

# Database Backup Script for Almonds
# Creates timestamped backups of the PostgreSQL database

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🗄️  Almonds Database Backup${NC}"
echo "=========================="
echo ""

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo -e "${RED}❌ .env file not found${NC}"
    exit 1
fi

# Extract database connection details from DATABASE_URL
# Format: postgresql://user:password@host:port/database
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ DATABASE_URL not set in .env${NC}"
    exit 1
fi

# Parse DATABASE_URL
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

# Backup directory
BACKUP_DIR="./backups"
mkdir -p $BACKUP_DIR

# Timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/almonds_backup_$TIMESTAMP.sql"

echo -e "${BLUE}📊 Database Info:${NC}"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"
echo "  Backup file: $BACKUP_FILE"
echo ""

# Create backup
echo -e "${BLUE}💾 Creating backup...${NC}"

export PGPASSWORD=$DB_PASS

if pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME > $BACKUP_FILE; then
    echo -e "${GREEN}✅ Backup created successfully${NC}"

    # Get file size
    SIZE=$(du -h $BACKUP_FILE | cut -f1)
    echo "  File size: $SIZE"

    # Compress backup
    echo -e "${BLUE}🗜️  Compressing backup...${NC}"
    gzip $BACKUP_FILE
    COMPRESSED_SIZE=$(du -h $BACKUP_FILE.gz | cut -f1)
    echo -e "${GREEN}✅ Backup compressed${NC}"
    echo "  Compressed size: $COMPRESSED_SIZE"

    BACKUP_FILE="$BACKUP_FILE.gz"
else
    echo -e "${RED}❌ Backup failed${NC}"
    exit 1
fi

echo ""

# Cleanup old backups (keep last 7 days)
echo -e "${BLUE}🧹 Cleaning up old backups...${NC}"
find $BACKUP_DIR -name "almonds_backup_*.sql.gz" -type f -mtime +7 -delete
echo -e "${GREEN}✅ Old backups cleaned up (keeping last 7 days)${NC}"

echo ""
echo -e "${GREEN}🎉 Backup complete!${NC}"
echo ""
echo -e "${BLUE}Restore command:${NC}"
echo "  gunzip -c $BACKUP_FILE | psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME"
echo ""

# List recent backups
echo -e "${BLUE}📋 Recent backups:${NC}"
ls -lh $BACKUP_DIR/almonds_backup_*.sql.gz 2>/dev/null | tail -5 || echo "  No backups found"
echo ""
