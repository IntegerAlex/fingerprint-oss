/**
 * Collects fingerprint samples and writes them to
 * test-results/fingerprint-samples.json, which scripts/entropy.mjs turns into
 * the stability/entropy table. Kept in e2e because every signal needs a real
 * browser: stubbing navigator would measure the stubs, not the browser.
 */

// Flattened components worth tracking. Keep this list in sync with what
// STABILITY.md documents.
const COMPONENTS = [
  'browser.name',
  'browser.version',
  'os.os',
  'os.version',
  'platform',
  'timezone',
  'languages',
  'screenResolution',
  'colorDepth',
  'colorGamut',
  'hardwareConcurrency',
  'deviceMemory',
  'vendor',
  'canvas.geometry',
  'webGL.vendor',
  'webGL.renderer',
  'webGL.imageHash',
  'audio',
  'detectedFonts',
  'touchSupport.maxTouchPoints',
  'deviceType.type',
  'mathConstants.acos',
  'enhanced.audioV2.sampleSum',
  'enhanced.webgl2.renderer',
  'enhanced.spoofing.score',
  'enhanced.optional.display.forcedColors',
  'enhanced.optional.dateTimeLocale.formatted',
  'enhanced.optional.speechVoices.count',
];

const readPath = (object, path) =>
  path.split('.').reduce((value, key) => (value == null ? undefined : value[key]), object);

const toSample = (info) =>
  Object.fromEntries(
    COMPONENTS.map(name => {
      let value = readPath(info, name);
      if (name === 'detectedFonts') value = info.fontPreferences?.detectedFonts?.length;
      if (Array.isArray(value)) value = value.join(',');
      return [name, value == null ? '<missing>' : String(value)];
    }),
  );

const SAMPLES = 5;

const collectSamples = (fp, remaining, samples = []) => {
  if (remaining === 0) return cy.wrap(samples);
  return fp.getSystemInfo()
    .then(info => fp.generateId(info).then(hash => {
      samples.push({ hash, ...toSample(info) });
      return collectSamples(fp, remaining - 1, samples);
    }));
};

describe('fingerprint stability and entropy', () => {
  it(`records ${SAMPLES} samples for the entropy report`, () => {
    cy.loadFingerprintOSS().then(fp =>
      collectSamples(fp, SAMPLES).then(samples => {
        cy.writeFile('test-results/fingerprint-samples.json', samples);
        const hashes = new Set(samples.map(sample => sample.hash));
        expect(hashes.size, 'every collection must yield the same id').to.equal(1);
      }),
    );
  });

  it('produces the same id after a reload', () => {
    cy.loadFingerprintOSS().then(fp =>
      fp.getSystemInfo().then(info => fp.generateId(info)),
    ).then(before => {
      cy.reload();
      cy.window({ timeout: 30000 }).its('fingerprintOSSReady').should('eq', true);
      cy.window().its('fingerprintOSS').then(fp =>
        fp.getSystemInfo().then(info => fp.generateId(info)),
      ).then(after => {
        expect(after, 'reload must not change the id').to.equal(before);
      });
    });
  });
});
