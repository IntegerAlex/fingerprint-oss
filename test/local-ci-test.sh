#!/bin/bash
set -e

# #Free up port 8080 if it's already in use
# echo "Checking if port 8080 is in use..."
# if lsof -i :8080 >/dev/null 2>&1; then
#     echo "Freeing port 8080..."
#     kill -9 $(lsof -t -i :8080)
# else
#     echo "Port 8080 is free."
# fi

# Install dependencies and build fingerprint-oss
echo "Installing dependencies and building fingerprint-oss..."
cd ..
npm install
npm run build
# npm run rollup is redundant since build already runs rollup


# Ensure jsdom is installed for Vitest
if ! npm list jsdom >/dev/null 2>&1; then
    echo "Installing jsdom for Vitest..."
    npm install --save-dev jsdom
fi

# # Step 2:Set up test/unit
# echo "Setting up unit tests..."
# cd test/unit
# npm install
# npm link fingerprint-oss
# npm test

# # Step 3: Set up test/e2e
# echo "Setting up e2e tests..."
# cd test/e2e
# npm install
# npm link fingerprint-oss

# Create symlink for local package
echo "Creating symlink for local package..."
npm link

# Navigate to test folder and link local module
echo "Installing test dependencies and linking local module..."
cd test
npm install
npm link ../

# Kill any existing process on port 8080 to prevent EADDRINUSE
echo "Attempting to free port 8080..."
#Try fuser(linux)
if command -v fuser &>/dev/null; then
    fuser -k 8080/tcp || true
#Try lsof(macOs,some linux)
elif command -v lsof &>/dev/null; then
    PID=$(lsof -ti :8080)
    if [ -n "$PID" ]; then
        echo "Killing process on port 8080 (PID: $PID)..."
        kill "$PID" 
    fi
elif command -v netstat &>/dev/null && command -v taskkill &>/dev/null; then
    PID=$(netstat -ano | findstr :8080 | awk '{print $NF}' | head -n 1)
    if [ -n "$PID" ]; then
        echo "Killing Windows process on port 8080 (PID: $PID)..."
        taskkill /PID "$PID" /F || true
    fi
else 
    echo "No suitable command found to free port 8080. Trying PowerShell fallback..."
    powershell -Command "Get-Process -Id (Get-NetTCPConnection -LocalPort 8080).OwningProcess | Stop-Process" 2>/dev/null || true
fi
# Start HTTP server in background
echo "Starting HTTP server..."
npx http-server -p 8080 &
SERVER_PID=$!

# Allow server to start up
sleep 2

# Run vitest unit test
echo "Running Vitest unit tests..."
npx vitest run

# Install Playwright browsers if needed
echo "Installing Playwright browsers..."
npx playwright install chromium firefox webkit

# Clean up - kill the server
echo "Cleaning up..."
kill $SERVER_PID

echo "Local CI test completed!"