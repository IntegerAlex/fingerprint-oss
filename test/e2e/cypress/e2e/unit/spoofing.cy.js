describe('spoofing detection', () => {
  // The tamper checks look for rewritten prototypes and own properties on
  // navigator/screen. A stock browser must not trip them: a false positive here
  // would mark every clean visitor as suspicious.
  it('does not flag an unpatched browser as tampered', () => {
    cy.loadFingerprintOSS().then((fp) => fp.getSystemInfo()).then((info) => {
      const tamperSignals = info.enhanced.spoofing.signals.filter((signal) => signal.startsWith('tamper:'));
      expect(tamperSignals, 'tamper false positives').to.deep.equal([]);
    });
  });

  // Patch inside the application window, not the spec window: Cypress runs the
  // spec in a separate iframe, and the library reads the app's prototypes. The
  // patch happens after cy.visit, which would otherwise wipe it.
  it('reports tampering when an API is replaced', () => {
    cy.loadFingerprintOSS().then((fp) => {
      cy.window().then((win) => {
        win.HTMLCanvasElement.prototype.toDataURL = function patched() { return 'data:,'; };
        return fp.getSystemInfo();
      }).then((info) => {
        expect(info.enhanced.spoofing.signals).to.include('tamper:non-native:canvas.toDataURL');
      });
    });
  });
});
