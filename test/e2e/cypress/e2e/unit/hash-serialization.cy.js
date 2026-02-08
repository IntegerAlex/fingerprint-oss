describe('hashing and serialization', () => {
  it('generates a stable hash from system info', () => {
    cy.loadFingerprintOSS().then((fp) => {
      return fp.getSystemInfo().then((info) => {
        return fp.generateId(info).then((hashA) => {
          return fp.generateId(info).then((hashB) => {
            expect(hashA).to.be.a('string');
            expect(hashB).to.be.a('string');
            expect(hashA).to.equal(hashB);
          });
        });
      });
    });
  });

  it('serializes output to JSON', () => {
    cy.loadFingerprintOSS().then((fp) => {
      return fp.getSystemInfo().then((info) => {
        return fp.fetchGeolocationInfo().then((geo) => {
          return fp.generateJSON(geo, info, 0.5).then((result) => {
            expect(result).to.be.ok;
            expect(result).to.have.property('hash');
          });
        });
      });
    });
  });
});
