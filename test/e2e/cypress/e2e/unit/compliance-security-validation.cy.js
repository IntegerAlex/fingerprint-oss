describe('compliance, security, validation', () => {
  it('exposes compliance toast', () => {
    cy.loadFingerprintOSS().then((fp) => {
      expect(fp.Toast).to.be.ok;
      expect(fp.Toast.show).to.be.a('function');
    });
  });

  it('handles input validation utilities', () => {
    cy.loadFingerprintOSS().then((fp) => {
      const consistency = fp.getLanguageConsistency('en-US', 'US');
      expect(consistency).to.be.a('number');
    });
  });

  it('handles basic security checks', () => {
    cy.loadFingerprintOSS().then((fp) => {
      return fp.getSystemInfo().then((info) => {
        const consistency = fp.checkBrowserConsistency(info);
        expect(consistency).to.be.a('number');
      });
    });
  });
});
