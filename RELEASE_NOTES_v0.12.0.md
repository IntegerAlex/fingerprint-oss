# Fingerprint OSS v0.12.0

**Release Date:** November 23, 2026

## Highlights

Agent traffic grew **+1,700% year over year** and more than half of internet
traffic is now non-human (Cloudflare, 2026), yet only ~2–4% of AI traffic
declares itself. This release gives integrators a defensible answer to "who is
this visitor?" — built on two maintained open-source projects instead of a
hand-rolled bot list — without changing a single existing field.

- New optional `agentAssessment` verdict on `SystemInfo`
- Powered by **BotD** (MIT) for automation evidence and **isbot** (Unlicense)
  for declared crawler/agent identity
- Spoofed declarations are called out explicitly
- Collection no longer saturates every CPU core: the core benchmark is **~8×
  cheaper** and cached, and the speech-voice probe waits 400 ms instead of 800
- `bot` is untouched; the fingerprint hash is untouched

---

## What's new

### `agentAssessment`

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

| Layer | Source | Answers |
|---|---|---|
| Automation | [BotD](https://github.com/fingerprintjs/BotD) (MIT) | Is the browser actually automated? Headless Chromium/Firefox, Selenium, Playwright, PhantomJS, Nightmare, Electron, WebDriver |
| Declaration | [isbot](https://github.com/omrilotan/isbot) (Unlicense) | Does the User-Agent claim to be a crawler/bot? Covers AI crawler-style agents like Claude Code |
| Declaration | Curated tokens | AI browser agents/assistants that isbot cannot see (ChatGPT, Gemini, Copilot, Perplexity, Operator, Comet) |
| Consistency | fingerprint-oss 0.11.0 | Prototype tamper, Client-Hints/UA disagreement, headless quirks |

### Reading the verdict

- **`automation`** (0.8) — automated browser, regardless of what the UA says.
- **`automation` (0.9) + `automation:spoofed-declaration`** — a *crawler* UA
  inside an automated browser. Crawlers do not execute JavaScript, so the
  declaration is spoofed. A UA that admits automation (headless, webdriver) or
  declares an AI agent is consistent and stays at 0.8.
- **`crawler` / `agent` / `assistant`** (0.5–0.6) — *self-declared*, unverified,
  `declaredBy: 'user-agent'`. A crawler is not automatically hostile.
- **`human`** (0.5) — no automation evidence and no declaration. Absence of
  evidence, not proof: a user-driven browser agent with a clean UA is
  indistinguishable client-side, and we say so rather than guessing.

### Verified against real automation

`test/automation` runs the assessment inside Puppeteer, Playwright and Selenium
against the same local Chromium and asserts the verdict, the BotD evidence
signal, id stability and the legacy `bot` field:

| Driver | Verdict | Evidence |
|---|---|---|
| puppeteer | automation 0.8 | `automation:botd:headless_chrome` |
| playwright | automation 0.8 | `automation:botd:headless_chrome` |
| selenium | automation 0.8 | `automation:botd:selenium` |

---

## Privacy

BotD is created with `monitoring: false`. Its default behaviour samples one in
a thousand loads and sends a request to `openfpcdn.io`; that request is disabled,
so fingerprint-oss remains 100% client-side. The new field is excluded from the
hash and from `JSON.stringify` output of the identity, matching the existing
`enhanced` design.

---

## Compatibility

| Surface | Guarantee |
|---|---|
| `bot` | unchanged shape and semantics |
| `generateId()` | untouched — `agentAssessment` is not hashed |
| `getSystemInfo()` | new collector runs in parallel and degrades to `unknown` on failure; never rejects |
| Bundle | 37.8 KB → 43.3 KB gzip (BotD ≈ 5.4 KB); CI budget raised to 52 KB |
| Exports | additive: `assessAgent`, `classifyAgent`, `declaredAiKind`, plus types |

`classifyAgent()` is exported so the weighting can be tested without a browser;
`assessAgent()` runs standalone when you only need the verdict.

---

### Evasion handling

A stealth plugin (`puppeteer-extra-plugin-stealth`) hides `navigator.webdriver`,
fakes plugins and the `chrome` object, and rewrites UA and Client Hints to a
Windows desktop. BotD reports nothing. Two traces survive and are fused into the
verdict:

1. headless signals from the spoofing layer (e.g. a taskbar-less 800×600 desktop)
2. a core-count contradiction — stealth reports `hardwareConcurrency: 4` while
   the benchmark measures 8
3. a renderer/OS contradiction — stealth rewrites the UA to Windows but its WebGL
   evasion still reports `Intel Inc.` / `Intel Iris OpenGL Engine`, which only
   exist on macOS

Trace 3 matters on CI: on a 4-vCPU runner the spoofed core count can match the
measured one, so the renderer contradiction is what catches the evasion.

Either alone is weak (fullscreen kiosks; phones with throttled cores), so the
verdict escalates only when both agree or two headless signals fire. The
evidence is always listed in `agentAssessment.signals`.

### Trust surfaces

- `SECURITY.md` + `/.well-known/security.txt` with private reporting and response targets
- `llms.txt` so agents and LLM tooling can find primary sources
- OpenSSF Scorecard workflow + README badge
- Release workflow: build → package validation → e2e → CycloneDX SBOM →
  `npm publish --provenance` → GitHub release with the SBOM attached

### Performance

- **Collection no longer pins every CPU core.** `estimateCores()` used to spawn
  16 workers for up to 1.2 s on every collection; it now measures effective
  parallelism with two short batches (1 then 8 workers, ~150 ms total) and caches
  the result for the page lifetime. Measured on a 16-thread machine: 16 workers /
  1209 ms → 9 workers / ~150 ms; repeat collections spawn **0** workers; the demo's
  dev load went from 32 workers / 2389 ms to 9 workers / 1096 ms.
  `navigator.hardwareConcurrency` is still not trusted — Brave and privacy
  browsers misreport it — but it is only the fallback now.
- **Speech-voice probe timeout 800 ms → 400 ms**, which only affects profiles with
  no voices installed (headless/CI). The signal is optional and never hashed.

## Installation

```bash
pnpm add fingerprint-oss@0.12.0
# or
npm install fingerprint-oss@0.12.0
```

---

## Verification

- `tsc --noEmit`, `publint`, `are-the-types-wrong` — clean
- Cypress: **36/36 passing**, including five agent-assessment specs, the core-benchmark
  caching assertion, and the stability/reload invariants
- Automation matrix (**4 drivers**): Puppeteer, Playwright and Selenium report
  `automation` with `automation:botd:*` evidence; the stealth driver reports
  `automation` 0.7 through the evasion fusion. Every driver's id is stable
- False-positive gate: all 266 User-Agents in Bowser's acceptance corpus are free
  of spurious `agent`/`assistant` classifications (the 3 AI-assistant fixtures
  are correct detections)
- Demo (Next 16, linked build): hash renders, all 30 legacy `SystemInfo` fields
  present, 13 named exports resolve, `tsc --noEmit` clean, no console errors
- Node checks: declared crawler, declared agent, assistant, automation-only,
  spoofed declaration, clean browser, missing UA, and declared-layer-only
  operation without a DOM

---

## Links

- [GitHub Repository](https://github.com/IntegerAlex/fingerprint-oss)
- [npm](https://www.npmjs.com/package/fingerprint-oss)
- [API reference](./API.md#agent-assessment)
- [Stability report](./STABILITY.md)
- [License: LGPL-3.0](https://github.com/IntegerAlex/fingerprint-oss/blob/main/LICENSE.md)
