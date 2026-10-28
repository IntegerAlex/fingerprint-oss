# Fingerprint OSS v0.11.0

**Release Date:** October 28, 2026

## Highlights

This release makes the package installable everywhere, deletes a 3,365-line fork, closes a **ReDoS** in browser detection, and adds the signals and tamper checks the other open-source fingerprinting libraries ship.

- `require('fingerprint-oss')` and `import 'fingerprint-oss'` both work again
- Bowser is a normal dependency; Android TV detection is preserved
- `getSystemInfo()` runs its collectors in parallel and never dies from one blocked API
- New low-cost signals, feature-first browser naming, prototype-tamper detection
- Real stability measurement instead of a claimed uniqueness number

---

## Breaking-ish

| Change | Why | Action |
|---|---|---|
| `dist/index.esm.js` → `dist/index.mjs`, `dist/index.cjs.js` → `dist/index.cjs` | The old CJS file was unloadable in a `"type": "module"` package | Import the package name, not the dist path. UMD stays at `dist/index.min.js` |
| `SystemInfo.browser` may name a different browser | Brave/Client Hints now win over the spoofable UA | Grouping by browser name will shift for Brave, Ladybug-class and Android TV users |

Everything else is additive.

---

## Security

### ReDoS in browser detection (GHSA-f9xq-72p3-q9fv)
The Firefox-on-iPad rule used `/Macintosh(.*?) FxiOS(.*?)\//`, which backtracks polynomially. A hostile User-Agent could block the event loop for seconds per parse. Bowser v2.15.0 replaces it with a linear scan and tightens four more patterns. Measured on a 16k-token adversarial UA: **324 ms before, 0.02 ms after**.

### Tamper detection
`enhanced.spoofing` now also reports:
- APIs rewritten in JavaScript (canvas, WebGL, audio, permissions) instead of `[native code]`
- own properties and patched getters on `navigator` / `screen`
- a Client Hints platform that disagrees with the UA

`likelyHeadless` now requires an actual headless signal, so a canvas blocker is reported as tampering rather than a bot.

---

## Packaging

`package.json` gains an `exports` map with per-condition types (`dist/index.d.ts` for ESM, `dist/index.d.cts` for CJS), `unpkg`/`jsdelivr` fields, and publishes all of `dist/`. Verified with `publint`, `attw` (all four resolution modes green) and a packed-tarball consumer on Node 26.

The library's own code is unchanged in size (35.4 KB gzip before the new signals), and the CI now fails when a bundle exceeds its 40 KB gzip budget.

---

## Detection

### Browser naming
Features first, UA second: Brave via `navigator.brave`, Firefox via Gecko-only globals, Safari via Safari-only DOM bindings (with an iOS guard so Chrome on iOS stays Chrome), Edge/Opera/Samsung via Client Hints brands. `getBrowserInfo()` reports `detectedBy` so you can see which source won. Across Bowser's own 266-fixture corpus, names and versions are unchanged.

### New signals (`enhanced.optional`)
CSS preferences, screen frame, `AudioContext.baseLatency`, Intl date/time formatting, hashed speech-voice list, Permissions API states. Non-enumerable and outside the hash.

---

## Measurement

`STABILITY.md` documents the method; CI runs a Cypress harness that collects five samples, asserts `generateId()` is identical across them and after a reload, and posts a per-component entropy/stability table to the job summary. We do not claim a population uniqueness figure — five samples on one machine measure repeatability, not distinctiveness.

---

## Installation

```bash
pnpm add fingerprint-oss@0.11.0
# or
npm install fingerprint-oss@0.11.0
```

CDN (UMD, global `fingerprintOss`):

```html
<script src="https://unpkg.com/fingerprint-oss"></script>
```

---

## Links

- [GitHub Repository](https://github.com/IntegerAlex/fingerprint-oss)
- [npm](https://www.npmjs.com/package/fingerprint-oss)
- [Stability report](./STABILITY.md)
- [Bowser v2.15.0 release](https://github.com/bowser-js/bowser/releases/tag/v2.15.0)
- [License: LGPL-3.0](https://github.com/IntegerAlex/fingerprint-oss/blob/main/LICENSE.md)
