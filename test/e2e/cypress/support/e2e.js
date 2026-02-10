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
