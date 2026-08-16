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

  it('detects bot characteristics', () => {
    cy.loadFingerprintOSS().then((fp) => {
      const result = fp.detectBot();
      expect(result).to.be.ok;
      expect(result.isBot).to.be.a('boolean');
      expect(result.signals).to.be.an('array');
      expect(result.confidence).to.be.a('number');
    });
  });

  it('detects desktop pointer/hover mismatch bot signal', () => {
    cy.visit('/');
    cy.window().then((win) => {
      Object.defineProperty(win.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
        configurable: true
      });
      cy.stub(win, 'matchMedia').callsFake((query) => {
        if (query === '(hover: none)') return { matches: true };
        if (query === '(pointer: fine)') return { matches: false };
        if (query === '(pointer: coarse)') return { matches: false };
        return { matches: false };
      });

      const result = win.fingerprintOSS.detectBot();
      expect(result.signals).to.include('strong:desktop-no-pointer-hover-mismatch');
    });
  });

  it('detects desktop headless resolution bot signal', () => {
    cy.visit('/');
    cy.window().then((win) => {
      Object.defineProperty(win.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
        configurable: true
      });
      Object.defineProperty(win, 'screen', {
        value: { width: 800, height: 600 },
        configurable: true
      });

      const result = win.fingerprintOSS.detectBot();
      expect(result.signals).to.include('medium:desktop-default-headless-resolution');
    });
  });
});
