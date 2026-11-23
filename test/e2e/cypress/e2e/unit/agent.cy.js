describe('agent assessment', () => {
  it('reports an agentAssessment on every collection', () => {
    cy.loadFingerprintOSS().then((fp) => fp.getSystemInfo()).then((info) => {
      const assessment = info.agentAssessment;
      expect(assessment, 'agentAssessment').to.be.an('object');
      expect(assessment.verdict).to.be.oneOf([
        'human', 'crawler', 'agent', 'assistant', 'automation', 'unknown',
      ]);
      expect(assessment.confidence).to.be.within(0, 1);
      expect(assessment.signals).to.be.an('array');
      // `bot` is the pre-0.12 field and must keep its shape.
      expect(info.bot).to.have.all.keys('isBot', 'signals', 'confidence');
    });
  });

  it('classifies a declared crawler', () => {
    cy.loadFingerprintOSS().then((fp) => {
      const result = fp.classifyAgent({
        userAgent: 'Mozilla/5.0 (compatible; GPTBot/1.2; +https://openai.com/gptbot)',
        declared: true,
        declaredMatch: 'Bot',
      });
      expect(result.verdict).to.equal('crawler');
      expect(result.declaredBy).to.equal('user-agent');
      expect(result.signals).to.include('declared:user-agent:isbot:Bot');
    });
  });

  it('recognises AI browser agents and assistants that isbot cannot see', () => {
    cy.loadFingerprintOSS().then((fp) => {
      expect(fp.declaredAiKind('Mozilla/5.0 Chrome/120.0 ChatGPT/1.1')).to.equal('assistant');
      expect(fp.declaredAiKind('claude-code/1.0.33 (darwin arm64)')).to.equal('agent');
      expect(fp.declaredAiKind('Mozilla/5.0 (X11; Linux x86_64) Chrome/120.0.0.0 Safari/537.36')).to.equal(null);
    });
  });

  it('escalates to automation when a declaration contradicts the engine', () => {
    cy.loadFingerprintOSS().then((fp) => {
      const result = fp.classifyAgent({
        userAgent: 'Mozilla/5.0 (compatible; GPTBot/1.2)',
        declared: true,
        declaredMatch: 'Bot',
        automation: { bot: true, kind: 'headless_chrome' },
      });
      expect(result.verdict).to.equal('automation');
      expect(result.confidence).to.equal(0.9);
      expect(result.signals).to.include('automation:spoofed-declaration');
    });
  });

  it('keeps the fingerprint id independent of the assessment', () => {
    cy.loadFingerprintOSS().then((fp) => fp.getSystemInfo().then((info) => fp.generateId(info)))
      .then((before) => {
        cy.window().its('fingerprintOSS').then((fp) => fp.getSystemInfo()
          .then((info) => fp.generateId(info)))
          .then((after) => expect(after).to.equal(before));
      });
  });
});
