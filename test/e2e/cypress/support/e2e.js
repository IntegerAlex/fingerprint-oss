const loadFingerprintOSS = (options = {}) => {
  const { waitForData = false } = options;

  cy.visit('/');
  cy.window({ timeout: 30000 }).its('fingerprintOSSReady').should('eq', true);
  if (waitForData) {
    cy.window({ timeout: 60000 }).its('testStatus').should('eq', 'success');
  }
  return cy.window().its('fingerprintOSS');
};

Cypress.Commands.add('loadFingerprintOSS', loadFingerprintOSS);

// Headless Electron's IndexedDB is flaky: detectIncognito() probes a temp DB and
// can race, throwing "Failed to execute 'transaction' on 'IDBDatabase': The
// database connection is closing." This is environmental and unrelated to any
// spec's assertions, so don't fail the run on it. Other errors still fail.
Cypress.on('uncaught:exception', (err) => {
  if (err && /database connection is closing/i.test(err.message || '')) {
    return false;
  }
  return true;
});
