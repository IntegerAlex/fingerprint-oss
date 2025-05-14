#!/bin/bash
set -e

# Install dependencies and build fingerprint-oss
echo "Installing dependencies and building fingerprint-oss..."
cd ..
npm install
npm run build
# npm run rollup is redundant since build already runs rollup

# Create symlink for local package
echo "Creating symlink for local package..."
npm link

# Navigate to test folder and link local module
echo "Installing test dependencies and linking local module..."
cd test
npm install
npm link ../

# Start HTTP server in background
echo "Starting HTTP server..."
npx http-server -p 8080 &
SERVER_PID=$!

# Allow server to start up
sleep 2

# Install Playwright browsers if needed
echo "Installing Playwright browsers..."
npx playwright install chromium firefox webkit

# Run Playwright tests
echo "Running Playwright tests..."
npx playwright test

# Clean up - kill the server
echo "Cleaning up..."
kill $SERVER_PID

echo "Local CI test completed!" 