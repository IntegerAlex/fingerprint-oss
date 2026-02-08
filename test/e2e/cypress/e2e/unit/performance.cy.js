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
});
