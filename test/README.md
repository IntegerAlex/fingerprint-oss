# Fingerprint OSS Tests

This directory contains browser-based tests for the fingerprint-oss library.

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
   ```

2. Install and run Cypress tests:
   ```bash
   cd test/e2e
   npm install
   npm test
   ```

## Test Structure

- `e2e/cypress/e2e/geoInfo.cy.js` - Cypress tests for geolocation functionality
- `e2e/cypress/e2e/systemInfo.cy.js` - Cypress tests for system information functionality
- `e2e/cypress/e2e/unit/*.cy.js` - Cypress-based unit test coverage
- `e2e/index.html` - Test page that loads the fingerprint-oss library

## GitHub Actions CI

The GitHub Actions workflow in `.github/workflows/playwright_tests.yml` runs these tests automatically on pull requests. 