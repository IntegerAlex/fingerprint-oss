const waitForFingerprintData = () => {
  cy.window({ timeout: 60000 }).its('testStatus').should('eq', 'success');
};

const assertFingerprintData = (testData) => {
  expect(testData).to.be.ok;
  expect(testData).to.be.an('object');
  expect(testData.systemInfo).to.be.ok;

  if (testData.systemInfo.adBlocker) {
    expect(testData.systemInfo.adBlocker.adBlocker).to.be.a('boolean');
    expect(testData.systemInfo.adBlocker.isBrave).to.be.a('boolean');
  }

  if (testData.systemInfo.incognito && testData.systemInfo.incognito.browserName) {
    expect([
      'Electron',
      'Chrome',
      'Firefox',
      'Brave',
      'Safari',
      'Edge',
      'Chromium',
      'HeadlessChrome'
    ]).to.include(testData.systemInfo.incognito.browserName);
  }

  if (testData.systemInfo.screenResolution) {
    expect(testData.systemInfo.screenResolution).to.be.an('array');
    expect(testData.systemInfo.screenResolution.length).to.equal(2);
    expect(testData.systemInfo.screenResolution[0]).to.be.a('number');
    expect(testData.systemInfo.screenResolution[1]).to.be.a('number');
  }

  if (testData.systemInfo.timezone) {
    expect(testData.systemInfo.timezone).to.be.a('string');
  }

  if (testData.systemInfo.localStorage !== undefined) {
    expect(testData.systemInfo.localStorage).to.be.a('boolean');
  }
  if (testData.systemInfo.sessionStorage !== undefined) {
    expect(testData.systemInfo.sessionStorage).to.be.a('boolean');
  }
  if (testData.systemInfo.indexedDB !== undefined) {
    expect(testData.systemInfo.indexedDB).to.be.a('boolean');
  }

  if (testData.systemInfo.bot && testData.systemInfo.bot.confidence !== undefined) {
    expect(testData.systemInfo.bot.confidence).to.be.a('number');
    expect(testData.systemInfo.bot.confidence).to.be.at.least(0);
  }
};

describe('fingerprint-oss systemInfo', () => {
  it('loads fingerprint data', () => {
    cy.visit('/');
    waitForFingerprintData();

    cy.window().its('test').then((testData) => {
      try {
        assertFingerprintData(testData);
      } catch (error) {
        cy.log(`Test failed. Full testData: ${JSON.stringify(testData, null, 2)}`);
        throw error;
      }
    });
  });
});
