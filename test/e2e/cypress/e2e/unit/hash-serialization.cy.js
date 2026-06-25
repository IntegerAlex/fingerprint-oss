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
        const geoMock = {
          ipAddress: '127.0.0.1',
          country: { isoCode: 'US', name: 'United States' },
          city: { name: 'New York', geonameId: 5128581 },
          location: { accuracyRadius: 10, latitude: 40.7128, longitude: -74.0060, timeZone: 'America/New_York' },
          traits: { isAnonymous: false, isAnonymousProxy: false, isAnonymousVpn: false, network: '127.0.0.1/32' }
        };
        return fp.generateJSON(geoMock, info, 0.5).then((result) => {
          expect(result).to.be.ok;
          expect(result).to.have.property('hash');
        });
      });
    });
  });
});
