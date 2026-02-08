describe('telemetry utilities', () => {
  it('exposes telemetry helpers', () => {
    cy.loadFingerprintOSS().then((fp) => {
      expect(fp.Telemetry).to.be.ok;
      expect(fp.Telemetry.initialize).to.be.a('function');
      expect(fp.withTelemetry).to.be.a('function');
    });
  });
});
