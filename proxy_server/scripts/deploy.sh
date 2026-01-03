#!/bin/bash
# Script to build and deploy the Cloudflare Worker

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Building Cloudflare Worker...${NC}"

# Build TypeScript
npm run build

# Check if build was successful
if [ ! -f "dist/worker-entry.js" ]; then
    echo -e "${RED}Error: Build failed - dist/worker-entry.js not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful!${NC}"

# Deploy to Cloudflare Workers
echo -e "${YELLOW}Deploying to Cloudflare Workers...${NC}"
wrangler deploy

echo -e "${GREEN}✅ Deployment complete!${NC}"

