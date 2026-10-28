describe('performance and stability', () => {
  it('handles concurrent calls', () => {
    cy.loadFingerprintOSS().then((fp) => {
      return Promise.all([
        fp.getSystemInfo(),
        fp.getSystemInfo(),
        fp.getSystemInfo()
      ]).then((results) => {
        expect(results.length).to.equal(3);
      });
    });
  });

  // The async collectors run in parallel, so a full collection should cost
  // roughly the slowest one (the core benchmark, capped at 1.2s) rather than
  // the sum. A generous budget still catches a regression back to serial awaits.
  it('collects within the latency budget', () => {
    cy.loadFingerprintOSS().then((fp) => {
      const started = performance.now();
      return fp.getSystemInfo().then(() => {
        const elapsed = performance.now() - started;
        cy.log(`getSystemInfo took ${elapsed.toFixed(0)}ms`);
        expect(elapsed).to.be.lessThan(3000);
      });
    });
  });
});
