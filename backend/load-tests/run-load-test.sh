#!/bin/bash

# Load Test Runner for Almonds API
# Runs k6 load tests and generates reports

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Almonds Load Test${NC}"
echo "==================="
echo ""

# Check if k6 is installed
if ! command -v k6 &> /dev/null; then
    echo -e "${RED}❌ k6 is not installed${NC}"
    echo ""
    echo "Install k6:"
    echo "  macOS:   brew install k6"
    echo "  Linux:   sudo gpg -k"
    echo "           sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69"
    echo "           echo 'deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main' | sudo tee /etc/apt/sources.list.d/k6.list"
    echo "           sudo apt-get update"
    echo "           sudo apt-get install k6"
    echo "  Docker:  docker run -i grafana/k6 run - <load-test.js"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ k6 $(k6 version) found${NC}"
echo ""

# Configuration
API_URL="${API_URL:-http://localhost:3000}"
TEST_FILE="${1:-load-test.js}"
OUTPUT_DIR="./results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RESULTS_FILE="$OUTPUT_DIR/results_$TIMESTAMP.json"

mkdir -p $OUTPUT_DIR

echo -e "${BLUE}Configuration:${NC}"
echo "  API URL: $API_URL"
echo "  Test File: $TEST_FILE"
echo "  Results: $RESULTS_FILE"
echo ""

# Check if API is reachable
echo -e "${BLUE}🔍 Checking API availability...${NC}"
if curl -sf "$API_URL/api/v1/health/live" > /dev/null; then
    echo -e "${GREEN}✅ API is reachable${NC}"
else
    echo -e "${RED}❌ API is not reachable at $API_URL${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}⚠️  Starting load test - this will generate significant load on the API${NC}"
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 0
fi

echo ""
echo -e "${BLUE}🔨 Running load test...${NC}"
echo ""

# Run k6 load test
k6 run \
  --out json="$RESULTS_FILE" \
  -e API_URL="$API_URL" \
  "$TEST_FILE"

echo ""
echo -e "${GREEN}✅ Load test completed${NC}"
echo ""

# Generate summary
echo -e "${BLUE}📊 Results Summary:${NC}"
echo "  Full results: $RESULTS_FILE"
echo ""

# Extract key metrics from results
if [ -f "$RESULTS_FILE" ]; then
    echo -e "${BLUE}Key Metrics:${NC}"

    # Parse JSON results (requires jq)
    if command -v jq &> /dev/null; then
        echo "  Request Duration (p95): $(jq -r '.metrics.http_req_duration.values."p(95)"' $RESULTS_FILE 2>/dev/null || echo 'N/A') ms"
        echo "  Request Duration (avg): $(jq -r '.metrics.http_req_duration.values.avg' $RESULTS_FILE 2>/dev/null || echo 'N/A') ms"
        echo "  Requests/sec: $(jq -r '.metrics.http_reqs.values.rate' $RESULTS_FILE 2>/dev/null || echo 'N/A')"
        echo "  Error Rate: $(jq -r '.metrics.http_req_failed.values.rate' $RESULTS_FILE 2>/dev/null || echo 'N/A')"
        echo "  Total Requests: $(jq -r '.metrics.http_reqs.values.count' $RESULTS_FILE 2>/dev/null || echo 'N/A')"
    else
        echo "  Install jq for detailed metrics: brew install jq (macOS) or apt-get install jq (Linux)"
    fi

    # File size
    SIZE=$(du -h "$RESULTS_FILE" | cut -f1)
    echo "  Results file size: $SIZE"
fi

echo ""
echo -e "${BLUE}💡 Tips:${NC}"
echo "  • View detailed results: cat $RESULTS_FILE | jq"
echo "  • Compare with previous runs in $OUTPUT_DIR"
echo "  • Monitor with Grafana: http://localhost:3001"
echo ""
