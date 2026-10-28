# Fingerprint Stability

This document covers how stable the fingerprint is, and how much information
each component carries. It deliberately does **not** claim a population
uniqueness figure: we do not have a population sample, so any such number would
be invented. ThumbmarkJS can say "~80% uniqueness" because they have traffic to
measure; we publish what we can actually measure.

## What we measure

The harness collects five samples per run in a real browser and computes, per
component:

| Metric | Meaning |
|---|---|
| **Entropy** | Shannon entropy in bits across the observed values |
| **Stability** | Share of samples agreeing with the modal value |
| **Distinct** | Number of distinct values observed |

Stability is what matters for identity: a component with high entropy but low
stability (e.g. canvas under a noise-injecting extension) makes the hash flip
between visits and is worse than useless.

Two additional assertions run as tests:

- five consecutive collections must produce the **same** `generateId()`
- a **page reload** must not change `generateId()`

## How to run it

```bash
pnpm run build
cd test && npm run test:e2e        # writes test-results/fingerprint-samples.json
node scripts/entropy.mjs test/e2e/test-results/fingerprint-samples.json
```

CI runs both the self-check and the report on every push, and posts the table to
the job summary. The self-check (`node scripts/entropy.mjs --self-check`) pins
the maths itself, so a broken formula fails even without a browser.

## Interpreting a result

- **Entropy 0 / stability 100%** — a constant in this environment. Useful only
  in combination with other machines; the harness cannot tell you whether it
  varies across devices.
- **High entropy, low stability** — a noisy signal. It should stay out of the
  hash, which is why the optional signals in `enhanced.optional` are excluded.
- **Stability below 100% for a hashed component** — a bug or an unstable API.
  The hashed set is intentionally narrow: user agent, platform, screen
  resolution, colour depth and gamut, OS, WebGL image hash, sorted detected
  fonts, canvas geometry, audio, rounded math constants and filtered plugins.

## Known limits

- The sample comes from one machine and, in CI, one headless browser. It
  measures *repeatability*, not *distinctiveness*.
- WebGL image hashes vary with GPU driver state on some Linux/macOS setups; the
  reload assertion catches a regression in the harness, not across machines.
- Privacy extensions (Brave, Firefox RFP) intentionally randomise several
  components. Expect lower stability there — that is the extension working.
