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
        expect(consistency).to.be.at.least(0);
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
