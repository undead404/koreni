#!/bin/bash

# Test script for import endpoint
# Usage: ./test-import.sh [url]

BASE_URL="${1:-http://localhost:4000}"
ENDPOINT="${BASE_URL}/api/submit"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "Testing /health endpoint: ${BASE_URL}/health"
echo "----------------------------------------"

response=$(curl -s -w "\n%{http_code}" "${BASE_URL}/health")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n 1)

if [ "$http_code" -eq 200 ]; then
  echo -e "${GREEN}✓ Success (${http_code})${NC}"
  echo "$body" | jq '.'
else
  echo -e "${RED}✗ Failed (${http_code})${NC}"
  echo "$body" | jq '.'
fi

echo "Testing import endpoint: ${ENDPOINT}"
echo "----------------------------------------"

# Create test CSV file
cat > test-data.csv << 'EOF'
id,date,value
1,2024-01-01,100
2,2024-01-02,200
3,2024-01-03,300
EOF

# Create test metadata
cat > test-metadata.json << 'EOF'
{
  "archiveItems": ["ДАКО-1-1-1", "ДАКО-2-2-2"],
  "author": "Test Author <test@example.com>",
  "date": "2024-01-01",
  "id": "test-table-001",
  "location": [55.75, 37.62],
  "sources": ["https://example.com/source1", "https://example.com/source2"],
  "tableLocale": "ru",
  "title": "Test Data Import",
  "yearsRange": [2020, 2021]
}
EOF

echo -e "\n${YELLOW}Test 1: Valid request${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST "${ENDPOINT}" \
  -F "file=@test-data.csv" \
  -F "metadata=$(cat test-metadata.json)")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n 1)

if [ "$http_code" -eq 200 ]; then
  echo -e "${GREEN}✓ Success (${http_code})${NC}"
  echo "$body" | jq '.'
else
  echo -e "${RED}✗ Failed (${http_code})${NC}"
  echo "$body" | jq '.'
fi

echo -e "\n${YELLOW}Test 2: Missing file${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST "${ENDPOINT}" \
  -F "metadata=$(cat test-metadata.json)")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n 1)

if [ "$http_code" -eq 400 ]; then
  echo -e "${GREEN}✓ Correctly rejected (${http_code})${NC}"
  echo "$body" | jq '.'
else
  echo -e "${RED}✗ Unexpected response (${http_code})${NC}"
  echo "$body" | jq '.'
fi

echo -e "\n${YELLOW}Test 3: Missing metadata${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST "${ENDPOINT}" \
  -F "file=@test-data.csv")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n 1)

if [ "$http_code" -eq 400 ]; then
  echo -e "${GREEN}✓ Correctly rejected (${http_code})${NC}"
  echo "$body" | jq '.'
else
  echo -e "${RED}✗ Unexpected response (${http_code})${NC}"
  echo "$body" | jq '.'
fi

echo -e "\n${YELLOW}Test 4: Invalid metadata JSON${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST "${ENDPOINT}" \
  -F "file=@test-data.csv" \
  -F "metadata={invalid json}")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n 1)

if [ "$http_code" -eq 400 ]; then
  echo -e "${GREEN}✓ Correctly rejected (${http_code})${NC}"
  echo "$body" | jq '.'
else
  echo -e "${RED}✗ Unexpected response (${http_code})${NC}"
  echo "$body" | jq '.'
fi

echo -e "\n${YELLOW}Test 5: Invalid metadata schema${NC}"
cat > invalid-metadata.json << 'EOF'
{
  "id": "test-001",
  "missing": "required fields"
}
EOF

response=$(curl -s -w "\n%{http_code}" -X POST "${ENDPOINT}" \
  -F "file=@test-data.csv" \
  -F "metadata=$(cat invalid-metadata.json)")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n 1)

if [ "$http_code" -eq 400 ]; then
  echo -e "${GREEN}✓ Correctly rejected (${http_code})${NC}"
  echo "$body" | jq '.'
else
  echo -e "${RED}✗ Unexpected response (${http_code})${NC}"
  echo "$body" | jq '.'
fi

# Cleanup
rm -f test-data.csv test-metadata.json invalid-metadata.json

echo -e "\n${GREEN}Tests completed${NC}"