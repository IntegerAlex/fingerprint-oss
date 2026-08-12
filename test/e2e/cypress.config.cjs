module.exports = {
  e2e: {
    baseUrl: 'http://localhost:8080',
    specPattern: 'cypress/e2e/**/*.cy.js',
    supportFile: 'cypress/support/e2e.js',
    // Async library calls (getSystemInfo, fetchGeolocationInfo, detectIncognito,
    // generateId) legitimately take several seconds in headless Electron, and
    // userInfo() awaits Promise.all([getSystemInfo(), fetchGeolocationInfo()])
    // which exceeds the 4000ms default and aborts as "promise never resolved".
    defaultCommandTimeout: 30000,
    requestTimeout: 30000
  }
};
