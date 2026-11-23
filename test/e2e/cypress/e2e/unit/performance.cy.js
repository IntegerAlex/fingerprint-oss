describe('performance and stability', () => {
  it('handles concurrent calls', () => {
    cy.loadFingerprintOSS().then((fp) => {
      return Promise.all([
        fp.getSystemInfo(),
        fp.getSystemInfo(),
        fp.getSystemInfo()
      ]).then((results) => {
        expect(results.length).to.equal(3);
      });
    });
  });

  // The async collectors run in parallel, so a full collection costs roughly
  // the slowest one rather than the sum. The core benchmark used to burn 16
  // worker threads for 1.2s; it is now two short batches and cached.
  it('collects within the latency budget', () => {
    cy.loadFingerprintOSS().then((fp) => {
      const started = performance.now();
      return fp.getSystemInfo().then(() => {
        const elapsed = performance.now() - started;
        cy.log(`getSystemInfo took ${elapsed.toFixed(0)}ms`);
        expect(elapsed).to.be.lessThan(2500);
      });
    });
  });

  // The core benchmark must not re-run on every collection: it is the most
  // expensive thing we do, and apps call getSystemInfo more than once.
  it('caches the core benchmark across collections', () => {
    cy.loadFingerprintOSS().then((fp) => {
      cy.window().then(async (win) => {
        const workers = await fp.getSystemInfo().then(() => {
          const RealWorker = win.Worker;
          let spawned = 0;
          win.Worker = class CountingWorker extends RealWorker {
            constructor(...args) {
              spawned += 1;
              super(...args);
            }
          };
          return fp.getSystemInfo().then(() => spawned);
        });
        expect(workers, 'workers spawned by the second collection').to.equal(0);
      });
    });
  });
});
