# Fingerprint OSS Tests

This directory contains end-to-end tests for the fingerprint-oss library.

## Running Tests Locally

You have two options to run the tests:

### Option 1: Using the local CI simulation script

This script simulates the entire CI workflow locally:

```bash
# Make sure the script is executable
chmod +x local-ci-test.sh

# Run the script
./local-ci-test.sh
```

### Option 2: Manual steps

1. Build the main package:
   ```bash
   cd ..
   npm install
   npm run build
   npm run rollup
   npm link
   ```

2. Install test dependencies:
   ```bash
   cd test
   npm install
   npm link ../
   ```

3. Start the HTTP server:
   ```bash
   npx http-server -p 8080
   ```

4. In a new terminal, run the tests:
   ```bash
   cd test
   npx playwright test
   ```

## Test Structure

- `geoInfo.test.js` - Tests for geolocation functionality
- `systemInfo.test.js` - Tests for system information functionality
- `index.html` - Test page that loads the fingerprint-oss library

## GitHub Actions CI

The GitHub Actions workflow in `.github/workflows/playwright_tests.yml` runs these tests automatically on pull requests. 