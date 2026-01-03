#!/bin/bash
# Script to upload MaxMind databases to Cloudflare R2

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Uploading MaxMind databases to Cloudflare R2...${NC}"

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}Error: wrangler CLI is not installed.${NC}"
    echo "Install it with: npm install -g wrangler"
    exit 1
fi

# Check if databases exist
if [ ! -f "city/city.mmdb" ]; then
    echo -e "${RED}Error: city/city.mmdb not found${NC}"
    exit 1
fi

if [ ! -f "country/country.mmdb" ]; then
    echo -e "${RED}Error: country/country.mmdb not found${NC}"
    exit 1
fi

if [ ! -f "asn/asn.mmdb" ]; then
    echo -e "${RED}Error: asn/asn.mmdb not found${NC}"
    exit 1
fi

# Create R2 bucket if it doesn't exist (this will fail if it already exists, which is fine)
echo -e "${YELLOW}Creating R2 bucket if it doesn't exist...${NC}"
wrangler r2 bucket create geoip-databases 2>/dev/null || echo "Bucket may already exist"

# Upload databases
echo -e "${GREEN}Uploading city.mmdb...${NC}"
wrangler r2 object put geoip-databases/city.mmdb --file=city/city.mmdb

echo -e "${GREEN}Uploading country.mmdb...${NC}"
wrangler r2 object put geoip-databases/country.mmdb --file=country/country.mmdb

echo -e "${GREEN}Uploading asn.mmdb...${NC}"
wrangler r2 object put geoip-databases/asn.mmdb --file=asn/asn.mmdb

echo -e "${GREEN}✅ All databases uploaded successfully!${NC}"

