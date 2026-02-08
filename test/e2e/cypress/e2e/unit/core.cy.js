describe('core system modules', () => {
  it('detects ad blockers', () => {
    cy.loadFingerprintOSS().then((fp) => {
      return fp.detectAdBlockers();
    }).then((result) => {
      expect(result).to.be.ok;
      expect(result.adBlocker).to.be.a('boolean');
      expect(result.isBrave).to.be.a('boolean');
    });
  });

  it('detects incognito mode', () => {
    cy.loadFingerprintOSS().then((fp) => {
      return fp.detectIncognito();
    }).then((result) => {
      expect(result).to.be.ok;
      expect(result.isPrivate).to.be.a('boolean');
    });
  });

  it('collects system info', () => {
    cy.loadFingerprintOSS().then((fp) => {
      return fp.getSystemInfo();
    }).then((info) => {
      expect(info).to.be.ok;
      expect(info).to.have.property('userAgent');
      expect(info).to.have.property('platform');
    });
  });

  it('fetches geo info', () => {
    cy.loadFingerprintOSS().then((fp) => {
      return fp.fetchGeolocationInfo();
    }).then((geo) => {
      expect(geo).to.be.ok;
      expect(geo).to.have.property('ipAddress');
      expect(geo).to.have.property('ipv4');
      expect(geo).to.have.property('ipv6');
    });
  });

  it('detects vpn status', () => {
    cy.loadFingerprintOSS().then((fp) => {
      return fp.getVpnStatus({ geoip: 'UTC', localtime: 'UTC' });
    }).then((vpn) => {
      expect(vpn).to.be.ok;
      expect(vpn).to.have.property('vpn');
      expect(vpn.vpn).to.have.property('status');
      expect(vpn.vpn).to.have.property('probability');
    });
  });
});
