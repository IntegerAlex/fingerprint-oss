describe('helper utilities', () => {
  it('reports storage capabilities', () => {
    cy.loadFingerprintOSS().then((fp) => {
      expect(fp.isLocalStorageEnabled()).to.be.a('boolean');
      expect(fp.isSessionStorageEnabled()).to.be.a('boolean');
      expect(fp.isIndexedDBEnabled()).to.be.a('boolean');
    });
  });

  it('reads basic rendering fingerprints', () => {
    cy.loadFingerprintOSS().then((fp) => {
      const canvas = fp.getCanvasFingerprint();
      expect(canvas).to.be.ok;
      const audio = fp.getAudioFingerprint();
      expect(audio).to.be.ok;
      const webgl = fp.getWebGLInfo();
      expect(webgl).to.be.ok;
    });
  });

  it('reports environment info', () => {
    cy.loadFingerprintOSS().then((fp) => {
      const vendorFlavors = fp.getVendorFlavors();
      expect(vendorFlavors).to.be.ok;
      const colorGamut = fp.getColorGamut();
      expect(colorGamut).to.be.ok;
    });
  });
});
