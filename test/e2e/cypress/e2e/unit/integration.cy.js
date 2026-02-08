describe('integration flows', () => {
  it('runs default fingerprint flow', () => {
    cy.loadFingerprintOSS().then((fp) => {
      return fp({ transparency: false }).then((result) => {
        expect(result).to.be.ok;
        expect(result).to.have.property('hash');
        expect(result).to.have.property('systemInfo');
        expect(result).to.have.property('confidenceAssessment');
      });
    });
  });

  it('runs default fingerprint flow with message', () => {
    cy.loadFingerprintOSS().then((fp) => {
      return fp({ transparency: true, message: 'test message' }).then((result) => {
        expect(result).to.have.property('hash');
      });
    });
  });
});
