# Fingerprint OSS v0.10.2

**Release Date:** October 28, 2026

## Highlights

This release updates the vendored Bowser browser detector to **v2.15.0**, closing a **polynomial ReDoS** in the Firefox-on-iPad detection rule and improving browser identification for Ladybird, HeyTap, Vivo, Vivaldi and Motorola Edge devices.

---

## Security

### ReDoS in browser detection (GHSA-f9xq-72p3-q9fv)
The Firefox-on-iPad rule used `/Macintosh(.*?) FxiOS(.*?)\//`, which backtracks polynomially on crafted input. A hostile User-Agent string could block the event loop for seconds per `Bowser.parse()` call.

The regex is replaced with a linear `Utils.isFirefoxOnIpad()` scan. The same fix was applied upstream to four further patterns (Linespider, SlackBot, and the generic fallback rule). Measured on a 16k-token adversarial UA: **324 ms before, 0.02 ms after**.

---

## What's New

### Browser and engine detection
- **Ladybird**: reported as `Ladybird`, with the new `LibWeb` engine (previously `Chrome` / `Blink`)
- **HeyTap Browser** and **Vivo Browser**: reported under their own names instead of `Chrome`
- **Motorola Edge**: no longer misidentified as Microsoft Edge — the Edge rule now requires `EdgA/`, `EdgiOS/`, etc., not a bare `EdgA` token
- **Vivaldi**: version resolution prefers User-Agent Client Hints brands, then falls back to the UA string

### API
- `parser.satisfies()` accepts an array of versions and matches if any entry matches:
  ```js
  Bowser.getParser(navigator.userAgent).satisfies({ chrome: ['>100', '>120'] });
  ```

### Compatibility
- `getBrandVersion()` uses the internal search helper instead of `Array.prototype.find`, which threw on browsers without ES6 polyfills

---

## Changes

| Category | Description |
|----------|-------------|
| **Security** | ReDoS fixed in the Firefox-on-iPad rule and four related patterns (GHSA-f9xq-72p3-q9fv) |
| **Added** | Ladybird detection with `LibWeb` engine, HeyTap Browser, Vivo Browser |
| **Fixed** | Motorola Edge devices misidentified as Microsoft Edge |
| **Changed** | Vivaldi resolves its version via Client Hints first |
| **Changed** | `satisfies()` accepts version arrays |

> **Upgrading note:** `getBrowserInfo().browser.name` now returns `HeyTap Browser`, `Vivo Browser` or `Ladybird` where it previously returned `Chrome`. Dashboards or allowlists that group by browser name will shift.

---

## Installation

```bash
pnpm add fingerprint-oss@0.10.2
# or
npm install fingerprint-oss@0.10.2
# or
yarn add fingerprint-oss@0.10.2
```

---

## Links

- [GitHub Repository](https://github.com/IntegerAlex/fingerprint-oss)
- [npm](https://www.npmjs.com/package/fingerprint-oss)
- [Bowser v2.15.0 release](https://github.com/bowser-js/bowser/releases/tag/v2.15.0)
- [License: LGPL-3.0](https://github.com/IntegerAlex/fingerprint-oss/blob/main/LICENSE.md)
