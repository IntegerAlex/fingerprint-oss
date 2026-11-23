/**
 * Collected inside the page. Written once as source so all three drivers run
 * exactly the same code: puppeteer and playwright accept a string, selenium
 * requires one.
 */
export const PROBE = `(async () => {
  if (!window.fp) throw new Error('fingerprint-oss failed to load');
  const info = await window.fp.getSystemInfo();
  const first = await window.fp.generateId(info);
  const second = await window.fp.generateId(info);
  return {
    assessment: info.agentAssessment,
    bot: info.bot,
    userAgent: info.userAgent,
    hashStable: first === second,
    spoofingSignals: info.enhanced?.spoofing?.signals ?? [],
  };
})()`;
