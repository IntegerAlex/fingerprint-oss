describe('confidence utilities', () => {
  it('evaluates risky ASN', () => {
    cy.loadFingerprintOSS().then((fp) => {
      const result = fp.isRiskyASN('AS12345');
      expect(result).to.be.a('boolean');
    });
  });

  it('computes UA/platform mismatch', () => {
    cy.loadFingerprintOSS().then((fp) => {
      const mismatch = fp.getUAPlatformMismatch(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'MacIntel'
      );
      expect(mismatch).to.be.a('number');
      expect(mismatch).to.be.at.least(0);
    });
  });

  it('checks browser consistency', () => {
    cy.loadFingerprintOSS().then((fp) => {
      return fp.getSystemInfo().then((info) => {
        const consistency = fp.checkBrowserConsistency(info);
        expect(consistency).to.be.a('number');
        // Signed score: 0 means consistent, each inconsistency subtracts 0.1
        // down to -0.3. A headless CI viewport can be larger than the reported
        // screen, so 0 is not a valid floor.
        expect(consistency).to.be.within(-0.3, 0.3);
      });
    });
  });

  it('computes language consistency', () => {
    cy.loadFingerprintOSS().then((fp) => {
      const consistency = fp.getLanguageConsistency('en-US', 'US');
      expect(consistency).to.be.a('number');
    });
  });
});
