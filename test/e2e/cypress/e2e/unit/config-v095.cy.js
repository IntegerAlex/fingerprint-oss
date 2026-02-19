describe('v0.9.5 configuration features', () => {
  it('minimal preset skips heavy collectors and generates warnings', () => {
    cy.loadFingerprintOSS().then((fp) => {
      return fp({ preset: 'minimal' }).then((result) => {
        expect(result).to.be.ok;
        expect(result).to.have.property('warnings');
        expect(result.warnings).to.be.an('array');
        expect(result.warnings).to.include('Minimal preset enabled: heavy collectors are skipped to reduce client compute');

        // In minimal preset, heavy collectors should be skipped
        // We can't directly test internal flags, but we can verify the result structure
        expect(result).to.have.property('systemInfo');
        expect(result.systemInfo).to.be.ok;

        // The result should still have a hash and other basic properties
        expect(result).to.have.property('hash');
        expect(result.hash).to.be.a('string');
      });
    });
  });

  it('geoTimeout generates warnings when fetch times out', () => {
    cy.loadFingerprintOSS().then((fp) => {
      // Very short timeout to force timeout behavior
      return fp({ geoTimeout: 1 }).then((result) => {
        expect(result).to.be.ok;
        expect(result).to.have.property('warnings');
        expect(result.warnings).to.be.an('array');

        // Should include a timeout-related warning
        const hasTimeoutWarning = result.warnings.some(warning =>
          warning.includes('timeout') || warning.includes('geo')
        );
        expect(hasTimeoutWarning).to.be.true;

        // geoInfo might be null or incomplete due to timeout
        if (result.geoInfo) {
          expect(result.geoInfo).to.be.an('object');
        }
      });
    });
  });

  it('strictConfig rejects unknown config keys with FingerprintError', () => {
    cy.loadFingerprintOSS().then((fp) => {
      // Test with unknown config key in strict mode
      const invalidConfig = {
        strictConfig: true,
        unknownField: 'test value',
        transparency: false
      };

      return fp(invalidConfig).then(() => {
        // Should not reach here - should reject
        throw new Error('Expected promise to reject');
      }).catch((error) => {
        expect(error).to.be.ok;
        expect(error.name).to.equal('FingerprintError');
        expect(error.code).to.equal('CONFIG_INVALID');
        expect(error.message).to.include('Invalid configuration');
        expect(error.message).to.include('unknownField');
      });
    });
  });

  it('strictConfig accepts valid configurations', () => {
    cy.loadFingerprintOSS().then((fp) => {
      const validConfig = {
        strictConfig: true,
        transparency: true,
        message: 'test message',
        preset: 'minimal',
        geoTimeout: 5000
      };

      return fp(validConfig).then((result) => {
        expect(result).to.be.ok;
        expect(result).to.have.property('hash');
        // Should not have config validation errors
        if (result.warnings && result.warnings.length > 0) {
          const configErrors = result.warnings.filter(w =>
            w.includes('Unknown config key') || w.includes('Invalid configuration')
          );
          expect(configErrors).to.have.length(0);
        }
      });
    });
  });

  it('non-strict config generates warnings for unknown keys', () => {
    cy.loadFingerprintOSS().then((fp) => {
      const configWithUnknownKey = {
        transparency: false,
        unknownField: 'test',
        anotherUnknown: 123
      };

      return fp(configWithUnknownKey).then((result) => {
        expect(result).to.be.ok;
        expect(result.warnings).to.be.an('array');

        // Should include warnings for unknown keys
        const unknownKeyWarnings = result.warnings.filter(w =>
          w.includes('Unknown config key')
        );
        expect(unknownKeyWarnings).to.have.length(2);
        expect(unknownKeyWarnings.some(w => w.includes('unknownField'))).to.be.true;
        expect(unknownKeyWarnings.some(w => w.includes('anotherUnknown'))).to.be.true;
      });
    });
  });

  it('geoTimeout clamping generates warnings', () => {
    cy.loadFingerprintOSS().then((fp) => {
      // Test with out-of-range geoTimeout values
      const configWithClampedTimeout = {
        geoTimeout: 50000  // Above max (20000)
      };

      return fp(configWithClampedTimeout).then((result) => {
        expect(result).to.be.ok;
        expect(result.warnings).to.be.an('array');

        // Should include clamping warning
        const clampingWarnings = result.warnings.filter(w =>
          w.includes('geoTimeout') && w.includes('clamped')
        );
        expect(clampingWarnings).to.have.length(1);
        expect(clampingWarnings[0]).to.include('20000ms'); // Max value
      });
    });
  });

  it('invalid environment value generates warnings', () => {
    cy.loadFingerprintOSS().then((fp) => {
      const configWithInvalidEnv = {
        environment: 'INVALID_ENV'
      };

      return fp(configWithInvalidEnv).then((result) => {
        expect(result).to.be.ok;
        expect(result.warnings).to.be.an('array');

        // Should include environment validation warning
        const envWarnings = result.warnings.filter(w =>
          w.includes('environment')
        );
        expect(envWarnings).to.have.length.greaterThan(0);
        expect(envWarnings.some(w => w.includes('TEST|DEV|STAGING|PROD'))).to.be.true;
      });
    });
  });

  it('preset minimal works with other config options', () => {
    cy.loadFingerprintOSS().then((fp) => {
      const config = {
        preset: 'minimal',
        transparency: true,
        message: 'minimal preset test',
        geoTimeout: 3000
      };

      return fp(config).then((result) => {
        expect(result).to.be.ok;
        expect(result.warnings).to.be.an('array');

        // Should include minimal preset warning
        const presetWarnings = result.warnings.filter(w =>
          w.includes('Minimal preset enabled')
        );
        expect(presetWarnings).to.have.length(1);

        // Should still have transparency message
        expect(result.systemInfo).to.be.ok;
        expect(result.hash).to.be.a('string');
      });
    });
  });
});