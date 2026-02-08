#!/bin/bash
set -e

# Install dependencies and build fingerprint-oss
echo "Installing dependencies and building fingerprint-oss..."
cd ..
npm install
npm run build
# npm run rollup is redundant since build already runs rollup

echo "Installing test dependencies..."
cd test/e2e
npm install

# Run Cypress tests (server is managed by start-server-and-test)
echo "Running Cypress tests..."
npm test

echo "Local CI test completed!" 