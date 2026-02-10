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

  it('includes deviceType in systemInfo', () => {
    cy.loadFingerprintOSS().then((fp) => {
      return fp().then((result) => {
        expect(result.systemInfo).to.have.property('deviceType');
        expect(result.systemInfo.deviceType).to.have.property('type');
        expect(['mobile', 'tablet', 'desktop', 'tv', 'unknown']).to.include(result.systemInfo.deviceType.type);
        expect(result.systemInfo.deviceType).to.have.property('confidence');
        expect(result.systemInfo.deviceType.confidence).to.be.at.least(0).and.at.most(1);
      });
    });
  });
});
