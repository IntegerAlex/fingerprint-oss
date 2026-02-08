describe('stability checks', () => {
  it('produces stable hashes across calls', () => {
    cy.loadFingerprintOSS().then((fp) => {
      return fp.getSystemInfo().then((info) => {
        return fp.generateId(info).then((first) => {
          return fp.generateId(info).then((second) => {
            expect(first).to.equal(second);
          });
        });
      });
    });
  });
});
