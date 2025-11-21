#!/bin/bash

# Health Check Script for Almonds API
# Performs comprehensive health checks on the running application

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
API_URL="${API_URL:-http://localhost:3000}"
TIMEOUT=5

echo -e "${BLUE}🏥 Almonds Health Check${NC}"
echo "======================"
echo ""
echo "API URL: $API_URL"
echo ""

# Check if API is reachable
echo -e "${BLUE}1. Checking API availability...${NC}"
if curl -sf -m $TIMEOUT "$API_URL/api/v1/health/live" > /dev/null; then
    echo -e "${GREEN}✅ API is reachable${NC}"
else
    echo -e "${RED}❌ API is not reachable${NC}"
    exit 1
fi

# Check liveness probe
echo ""
echo -e "${BLUE}2. Checking liveness probe...${NC}"
LIVENESS_STATUS=$(curl -s -m $TIMEOUT -o /dev/null -w "%{http_code}" "$API_URL/api/v1/health/live")
if [ "$LIVENESS_STATUS" == "200" ]; then
    echo -e "${GREEN}✅ Liveness check passed${NC}"
else
    echo -e "${RED}❌ Liveness check failed (HTTP $LIVENESS_STATUS)${NC}"
    exit 1
fi

# Check readiness probe
echo ""
echo -e "${BLUE}3. Checking readiness probe...${NC}"
READINESS_STATUS=$(curl -s -m $TIMEOUT -o /dev/null -w "%{http_code}" "$API_URL/api/v1/health/ready")
if [ "$READINESS_STATUS" == "200" ]; then
    echo -e "${GREEN}✅ Readiness check passed${NC}"
else
    echo -e "${YELLOW}⚠️  Readiness check failed (HTTP $READINESS_STATUS)${NC}"
fi

# Check full health endpoint
echo ""
echo -e "${BLUE}4. Checking full health status...${NC}"
HEALTH_RESPONSE=$(curl -s -m $TIMEOUT "$API_URL/api/v1/health")
HEALTH_STATUS=$(echo $HEALTH_RESPONSE | grep -o '"status":"[^"]*"' | cut -d'"' -f4)

if [ "$HEALTH_STATUS" == "ok" ]; then
    echo -e "${GREEN}✅ All health checks passed${NC}"

    # Parse and display individual checks
    echo ""
    echo -e "${BLUE}Health Details:${NC}"

    # Database
    if echo $HEALTH_RESPONSE | grep -q '"database":.*"status":"up"'; then
        echo -e "  ${GREEN}✅${NC} Database: up"
    else
        echo -e "  ${RED}❌${NC} Database: down"
    fi

    # Memory
    if echo $HEALTH_RESPONSE | grep -q '"memory_heap":.*"status":"up"'; then
        echo -e "  ${GREEN}✅${NC} Memory: healthy"
    else
        echo -e "  ${YELLOW}⚠️${NC} Memory: warning"
    fi

    # Disk
    if echo $HEALTH_RESPONSE | grep -q '"disk":.*"status":"up"'; then
        echo -e "  ${GREEN}✅${NC} Disk: healthy"
    else
        echo -e "  ${YELLOW}⚠️${NC} Disk: warning"
    fi
else
    echo -e "${RED}❌ Health check failed${NC}"
    echo "Response: $HEALTH_RESPONSE"
    exit 1
fi

# Check API documentation
echo ""
echo -e "${BLUE}5. Checking API documentation...${NC}"
DOCS_STATUS=$(curl -s -m $TIMEOUT -o /dev/null -w "%{http_code}" "$API_URL/api/docs")
if [ "$DOCS_STATUS" == "200" ]; then
    echo -e "${GREEN}✅ API documentation is accessible${NC}"
    echo "  URL: $API_URL/api/docs"
else
    echo -e "${YELLOW}⚠️  API documentation not accessible (HTTP $DOCS_STATUS)${NC}"
fi

# Check response time
echo ""
echo -e "${BLUE}6. Checking response time...${NC}"
RESPONSE_TIME=$(curl -s -m $TIMEOUT -o /dev/null -w "%{time_total}" "$API_URL/api/v1/health/live")
echo "  Response time: ${RESPONSE_TIME}s"

# Convert to milliseconds for comparison
RESPONSE_TIME_MS=$(echo "$RESPONSE_TIME * 1000" | bc | cut -d'.' -f1)

if [ "$RESPONSE_TIME_MS" -lt 100 ]; then
    echo -e "  ${GREEN}✅ Excellent (<100ms)${NC}"
elif [ "$RESPONSE_TIME_MS" -lt 500 ]; then
    echo -e "  ${GREEN}✅ Good (<500ms)${NC}"
elif [ "$RESPONSE_TIME_MS" -lt 1000 ]; then
    echo -e "  ${YELLOW}⚠️  Acceptable (<1s)${NC}"
else
    echo -e "  ${RED}❌ Slow (>1s)${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Health check complete!${NC}"
echo ""

# Summary
echo -e "${BLUE}Summary:${NC}"
echo "  Status: $HEALTH_STATUS"
echo "  Response Time: ${RESPONSE_TIME}s"
echo "  API Docs: $API_URL/api/docs"
echo ""

exit 0
