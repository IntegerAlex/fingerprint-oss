# Automation detection matrix

Proves that `agentAssessment` fires inside the automation frameworks real agents
use — not just in a hand-written fixture.

Four drivers, one browser build each run:

| Driver | Stack | Detected as |
|---|---|---|
| `puppeteer` | `puppeteer-core` over CDP | `automation:botd:headless_chrome` |
| `playwright` | `playwright-core` | `automation:botd:headless_chrome` |
| `selenium` | `selenium-webdriver` + chromedriver (W3C WebDriver) | `automation:botd:selenium` |
| `stealth` | `puppeteer-extra` + `puppeteer-extra-plugin-stealth` | `automation:headless:no-taskbar` + `automation:core-count-mismatch` |

The stealth driver is the interesting one: it hides `navigator.webdriver`, fakes
plugins and the `chrome` object, and rewrites the UA/Client Hints to a Windows
desktop. BotD reports nothing. Two traces survive and are fused into the verdict
by `fuseAutomationEvidence()`:

1. `headless:no-taskbar` from the spoofing layer (800×600 "desktop" with
   `availWidth === width`)
2. a core-count contradiction — stealth reports `hardwareConcurrency: 4` while
   the benchmark measures 8, because it can spoof a property but not throughput

Either alone is too weak (fullscreen kiosks; phones with throttled cores), so the
fusion requires both, or two independent headless signals.

All three drive the **same local Chromium**, so a difference in results means a
difference in the framework, not the browser build.

## Run

```bash
pnpm run build                     # dist/ must exist; the page imports dist/index.mjs
cd test/automation
npm install
node run.mjs                       # all drivers
node run.mjs selenium              # one driver
```

Browser discovery, in order: `CHROME_PATH`, `/usr/bin/chromium`,
`/usr/bin/chromium-browser`, `/usr/bin/google-chrome`, macOS Chrome. Driver
discovery: `CHROMEDRIVER_PATH`, `/usr/bin/chromedriver`,
`/usr/local/bin/chromedriver` (omitted, Selenium Manager fetches one).

## What is asserted

For every driver:

1. `agentAssessment` is present.
2. `verdict === 'automation'`.
3. A `automation:botd:*` signal is present — i.e. the evidence is BotD's, not
   an inference of ours.
4. `confidence >= 0.6`.
5. `generateId()` is identical across two collections in the same session.
6. The legacy `bot` field is still present.

The last two are the backward-compatibility half of the matrix: detection must
not disturb identity.

## Why this exists

BotD is maintained upstream in stability-only mode, and `isbot`'s pattern list
turns over weekly. A detection library that is not exercised against the
frameworks it claims to detect is a guess. This matrix is the regression gate
for that claim, and it is where a future stealth-plugin corpus should plug in.

## CI

The `automation-matrix` job in `.github/workflows/ci.yml` runs one driver per
matrix entry, installing a matched Chrome/chromedriver pair with
`@puppeteer/browsers` and exporting `CHROME_PATH` / `CHROMEDRIVER_PATH`.
