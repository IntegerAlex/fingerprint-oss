# Fingerprint OSS v0.11.0

**Release Date:** November 23, 2026

## Highlights

One release, two halves. The package was broken for every Node consumer, carried a 3,365-line fork of Bowser, and burned every CPU core on each collection — and the web it measures now has more agents than people. v0.11.0 fixes the packaging, drops the fork, makes collection cheap, and adds a defensible answer to "who is this visitor?", built on maintained open-source projects rather than a hand-rolled list.

- `require('fingerprint-oss')` and `import 'fingerprint-oss'` both work again
- Bowser is a normal dependency; Android TV detection is preserved
- `getSystemInfo()` runs its collectors in parallel, never dies from one blocked API, and no longer saturates the CPU
- New `agentAssessment`: human / crawler / agent / assistant / automation, including evasion handling
- Real stability measurement instead of a claimed uniqueness number
- Security policy, `llms.txt`, SBOM and provenance publishing

---

## Breaking-ish

| Change | Why | Action |
|---|---|---|
| `dist/index.esm.js` → `dist/index.mjs`, `dist/index.cjs.js` → `dist/index.cjs` | The old CJS file was unloadable in a `"type": "module"` package | Import the package name, not the dist path. UMD stays at `dist/index.min.js` |
| `SystemInfo.browser` may name a different browser | Brave/Client Hints now win over the spoofable UA | Grouping by browser name shifts for Brave, Ladybird-class and Android TV users |

Everything else is additive: `bot`, `generateId()` and every existing field keep their shape, and new fields are optional and excluded from the hash.

---

## Security

### ReDoS in browser detection (GHSA-f9xq-72p3-q9fv)
The Firefox-on-iPad rule used `/Macintosh(.*?) FxiOS(.*?)\//`, which backtracks polynomially; a hostile User-Agent could block the event loop for seconds per parse. Bowser v2.15.1 replaces it with a linear scan and tightens four more patterns. Measured on a 16k-token adversarial UA: **324 ms before, 0.02 ms after**.

### Tamper detection
`enhanced.spoofing` reports APIs rewritten in JavaScript (canvas, WebGL, audio, permissions), own properties and patched getters on `navigator`/`screen`, a Client Hints platform that disagrees with the UA, and a renderer/OS contradiction. `likelyHeadless` requires an actual headless signal, so a canvas blocker is reported as tampering rather than a bot.

---

## Agent and automation assessment

`systemInfo.agentAssessment` fuses three layers:

| Layer | Source | Answers |
|---|---|---|
| Automation | [BotD](https://github.com/fingerprintjs/BotD) (MIT) | Is the browser actually automated? Headless Chromium/Firefox, Selenium, Playwright, PhantomJS, Nightmare, Electron, WebDriver |
| Declaration | [isbot](https://github.com/omrilotan/isbot) (Unlicense) | Does the UA claim to be a crawler/bot? Covers AI crawler-style agents such as Claude Code |
| Declaration | Curated tokens | AI browser agents/assistants isbot cannot see: ChatGPT, Gemini, Copilot, Perplexity, Operator, Comet |
| Consistency | This library | Prototype tamper, Client Hints/UA disagreements, renderer/OS contradictions |

```js
const info = await getSystemInfo();
// {
//   verdict: 'automation' | 'agent' | 'assistant' | 'crawler' | 'human' | 'unknown',
//   confidence: 0.9,
//   declaredBy: 'user-agent',
//   signals: ['automation:botd:headless_chrome', 'declared:user-agent:ai-agent',
//             'automation:spoofed-declaration']
// }
```

### Reading the verdict

- **`automation` (0.8)** — automated browser, regardless of what the UA says.
- **`automation` (0.9) + `automation:spoofed-declaration`** — a *crawler* UA inside an automated browser. Crawlers do not execute JavaScript, so the declaration is spoofed.
- **`crawler` / `agent` / `assistant` (0.5–0.6)** — self-declared, unverified, `declaredBy: 'user-agent'`.
- **`human` (0.5)** — no automation evidence and no declaration. Absence of evidence, not proof.

### Evasion handling

`puppeteer-extra-plugin-stealth` hides `navigator.webdriver`, fakes plugins and the `chrome` object, and rewrites UA and Client Hints to a Windows desktop. BotD reports nothing. Three traces survive, and `fuseAutomationEvidence()` folds them into the verdict:

1. headless signals from the spoofing layer (e.g. a taskbar-less 800×600 desktop)
2. a core-count contradiction — stealth reports `hardwareConcurrency: 4` while the benchmark measures 8
3. a renderer/OS contradiction — the UA says Windows, but WebGL still reports macOS-only strings (`Intel Inc.` / `Intel Iris OpenGL Engine`)

Trace 3 matters on CI: on a 4-vCPU runner the spoofed and measured core counts can agree, so the renderer contradiction is what catches the evasion. A headless signal plus either contradiction (or two headless signals) escalates to `automation` at 0.7. Single weak signals are recorded without flipping the verdict, so fullscreen kiosks and phones with throttled cores are not flagged.

### Verified against real automation

| Driver | Verdict | Evidence |
|---|---|---|
| puppeteer | automation 0.8 | `automation:botd:headless_chrome` |
| playwright | automation 0.8 | `automation:botd:headless_chrome` |
| selenium | automation 0.8 | `automation:botd:selenium` |
| stealth | automation 0.7 | `automation:headless:no-taskbar` + `automation:renderer-os-mismatch` |

---

## Packaging

`package.json` gains an `exports` map with per-condition types (`dist/index.d.ts` for ESM, `dist/index.d.cts` for CJS), `unpkg`/`jsdelivr` fields, and publishes all of `dist/`. Verified with `publint`, `attw` (all four resolution modes green) and a packed-tarball consumer on Node 26.

Also new: `outputVersion` on `SystemInfo` and a generated JSON Schema at `dist/systeminfo.schema.json` (importable as `fingerprint-oss/dist/systeminfo.schema.json`), plus `geoEndpoint` for a self-hosted https geolocation proxy.

---

## Detection

### Browser naming
Features first, UA second: Brave via `navigator.brave`, Firefox via Gecko-only globals, Safari via Safari-only DOM bindings (with an iOS guard so Chrome on iOS stays Chrome), Edge/Opera/Samsung via Client Hints brands. `getBrowserInfo()` reports `detectedBy`. Across Bowser's own 266-fixture corpus, names and versions are unchanged.

### New signals (`enhanced.optional`)
CSS preferences, screen frame, `AudioContext.baseLatency`, Intl date/time formatting, hashed speech-voice list, Permissions API states, and Client Hints architecture/bitness with an architecture/UA mismatch flag. Non-enumerable and outside the hash.

---

## Performance

The core benchmark used to spawn `min(cores × 2, 16)` workers for up to 1.2 s on every collection, then throw the answer away. It now measures effective parallelism with two short batches (1 then 8 workers), computes `cores ≈ workers × single / parallel`, caches the promise for the page lifetime, and re-measures once if a contended sample looks implausible.

On a 16-thread machine: **16 workers / 1209 ms → 9 workers / ~150 ms**; repeat collections spawn **0** workers; the demo's dev load went from 32 workers / 2389 ms to 9 workers / 1096 ms. The speech-voice probe timeout also dropped 800 ms → 400 ms, which only affects profiles with no voices installed.

---

## Privacy

BotD is created with `monitoring: false`. Its default behaviour samples one in a thousand loads and sends a request to `openfpcdn.io`; that request is disabled, so fingerprint-oss remains 100% client-side. `agentAssessment`, `enhanced` and `warnings` are excluded from the hash.

---

## Trust surfaces

- `SECURITY.md` + `/.well-known/security.txt` with private reporting and response targets
- `llms.txt` so agents and LLM tooling can find primary sources
- OpenSSF Scorecard workflow + README badge
- Release workflow: build → package validation → e2e → CycloneDX SBOM → `npm publish --provenance` → GitHub release with the SBOM attached

---

## Measurement

`STABILITY.md` documents the method; CI runs a Cypress harness that collects five samples, asserts `generateId()` is identical across them and after a reload, and posts a per-component entropy/stability table to the job summary. We do not claim a population uniqueness figure — five samples on one machine measure repeatability, not distinctiveness.

## Verification

- Cypress: **36/36**
- Automation matrix (**4 drivers**): Puppeteer, Playwright, Selenium and a stealth-evasion driver; every driver reports automation with named evidence, and ids stay stable
- False-positive gate: all 266 User-Agents in Bowser's acceptance corpus, with only the 3 real AI-assistant UAs classified as assistants
- `publint`, `attw` and a packed-tarball consumer (ESM + CJS) clean
- Demo compatibility check against Next 16: all 30 legacy `SystemInfo` fields present, hash stable across calls and reload, `tsc` clean

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
- [API reference](./API.md)
- [Stability report](./STABILITY.md)
- [Security policy](./SECURITY.md)
- [Bowser v2.15.1 release](https://github.com/bowser-js/bowser/releases/tag/v2.15.1)
- [License: LGPL-3.0](https://github.com/IntegerAlex/fingerprint-oss/blob/main/LICENSE.md)
