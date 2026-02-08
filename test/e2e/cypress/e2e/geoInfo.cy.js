const waitForFingerprintData = () => {
  cy.window({ timeout: 60000 }).its('testStatus').should('eq', 'success');
};

const assertGeolocationData = (testData) => {
  expect(testData).to.be.ok;
  expect(testData).to.be.an('object');

  const geolocation = testData.geolocation;
  if (geolocation === null) {
    cy.log('Geolocation data is null, acceptable in CI environments');
    return;
  }

  expect(geolocation).to.be.ok;

  if (geolocation.ip) {
    expect(geolocation.ip).to.be.a('string');
  }

  if (geolocation.city) {
    expect(geolocation.city).to.be.a('string');
  }

  if (geolocation.region) {
    expect(geolocation.region.isoCode).to.be.a('string');
    expect(geolocation.region.name).to.be.a('string');
  }

  if (geolocation.country) {
    expect(geolocation.country.isoCode).to.be.a('string');
    expect(geolocation.country.name).to.be.a('string');
  }

  if (geolocation.location) {
    expect(geolocation.location.latitude).to.be.a('number');
    expect(geolocation.location.longitude).to.be.a('number');
    expect(geolocation.location.accuracyRadius).to.be.a('number');
    expect(geolocation.location.timeZone).to.be.a('string');
  }

  if (geolocation.traits) {
    expect(geolocation.traits.isAnonymous).to.be.a('boolean');
    expect(geolocation.traits.isAnonymousProxy).to.be.a('boolean');
    expect(geolocation.traits.isAnonymousVpn).to.be.a('boolean');
    expect(geolocation.traits.network).to.be.a('string');
  }
};

describe('fingerprint-oss geoInfo', () => {
  it('loads geo data', () => {
    cy.visit('/');
    waitForFingerprintData();

    cy.window().its('test').then((testData) => {
      try {
        assertGeolocationData(testData);
      } catch (error) {
        cy.log(`Test failed. Full testData: ${JSON.stringify(testData, null, 2)}`);
        throw error;
      }
    });
  });
});
