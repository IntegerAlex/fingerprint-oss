# Fingerprint OSS Roadmap

Planned releases and features for versions 0.9.5 through 1.0. Timeline and scope are subject to change based on community feedback and capacity.

**Current status:** v0.11.0 is the feature release that closes out most of this roadmap: the dual-package fix, the Bowser de-vendoring, parallel collection, agent/automation assessment (BotD + isbot) with evasion handling, the core-benchmark rewrite, Client Hints architecture signals, `geoEndpoint`, `outputVersion` with a generated JSON Schema, the stability harness, CI hardening and the security/release trust surfaces. What remains for 1.0 is the public-API audit and the plugin/hook work below.

---

## v0.9.5 — Robustness & Developer Experience

**Theme:** Stability, validation, and better tooling for integrators.

### Validation & Input Sanitization

- **Config validation** — Validate and sanitize `userInfo` config options; warn or error on invalid values
- **Output shape guards** — Ensure all optional fields have consistent fallbacks; no `undefined` in serialized output where a default is expected
- **Schema exports** — Export TypeScript/Zod schemas for output validation in consuming applications _(shipped in 0.11.0: `dist/systeminfo.schema.json`, importable as `fingerprint-oss/dist/systeminfo.schema.json`)_

### Error Handling & Resilience

- **Structured error types** — Introduce `FingerprintError` with codes (e.g. `GEO_FAILED`, `CANVAS_BLOCKED`) for programmatic handling
- **Graceful degradation flags** — Add `warnings` array to output when features fail (e.g. WebGL blocked, geolocation timeout)
- **Geolocation timeout config** — Allow `geoTimeout` in config for custom geolocation fetch timeout

### Developer Experience

- **npm `exports` field** — Proper package exports for ESM, CJS, and types _(shipped in 0.11.0, including `.d.cts` for CommonJS consumers)_
- **UMD global name** — Document and stabilize UMD bundle usage
- **Integration tests** — Broader Cypress coverage for hash stability and cross-browser behavior

---

## v0.9.6 — Configuration & Extensibility

**Theme:** Flexibility for different deployment and compliance needs.

### Configuration

- **Custom geo endpoint** — `geoEndpoint` option to point to self-hosted or alternate geolocation proxy _(shipped in 0.11.0; https-only, with a config warning on invalid values)_
- **Feature flags** — Opt-in/opt-out for modules (e.g. `disableCanvas`, `disableWebGL`, `disableDeviceType`) for privacy/performance trade-offs
- **Server-side config** — Support `userAgent` and `clientIp` in config for server-side fingerprinting

### Extensibility

- **Plugin / middleware hooks** — Lifecycle hooks (e.g. `beforeCollect`, `afterCollect`) for custom enrichment or filtering
- **Custom hash salt** — Optional salt for hash generation to support multi-tenant or rotated identifiers
- **Exported collectors** — Allow importing individual collectors for tree-shaking and custom pipelines

### Performance

- **Lazy module loading** — Defer loading heavy modules (e.g. Bowser, hash-wasm) until needed
- **Concurrent collection limits** — Configurable parallelism to avoid browser throttling
- **Bundle size reporting** — Add build script to report ESM/CJS/UMD sizes to CI _(shipped in 0.11.0: `scripts/check-size.mjs` fails over a gzip budget)_

---

## v0.9.7 — Advanced Features & Hardening

**Theme:** New signals, security hardening, and 1.0 preparation.

### New Detection Capabilities

- **Connection type hint** — `navigator.connection` (effectiveType, downlink) when available; respect privacy
- **Referrer policy detection** — Indicate if referrer is stripped for attribution context
- **Storage persistence** — Optional persistence test with clear opt-in and timeout
- **Cross-origin isolation** — Detect `crossOriginIsolated` and `SharedArrayBuffer` availability

### Security & Privacy

- **Input validation hardening** — Guard against prototype pollution and malformed config
- **CSP-friendly bundle** — Ensure no inline scripts; document CSP headers for safe embedding
- **Subresource Integrity (SRI)** — Publish SRI hashes for CDN builds

### API & Output

- **Stable output version** — Add `outputVersion` field for future schema evolution _(shipped in 0.11.0)_
- **Deprecation notices** — Clear deprecation path for legacy fields (e.g. `ip` alone) with migration docs
- **Documentation generation** — Auto-generate API docs from JSDoc/TypeScript for each release

### Pre-1.0 Checklist

- Audit all public APIs for stability guarantees
- Finalize breaking changes for 1.0
- Update NOTICE.md and compliance docs
- Performance and bundle size benchmarks

---

## Release Cadence

| Version | Target Focus           | Status        |
|--------|------------------------|---------------|
| 0.9.5  | Robustness & DX        | Shipped       |
| 0.9.6  | Config & Extensibility | Shipped       |
| 0.10.0 | Bowser / detectIncognito upgrades | Shipped (maintenance) |
| 0.10.1 | pnpm migration, telemetry deprecation, security fixes | Shipped (maintenance) |
| 0.9.7  | Advanced & Hardening   | Upcoming      |
| 1.0.0  | Stable public API      | Planned       |

---

## Feedback

Suggestions and contributions are welcome. Open an [issue](https://github.com/IntegerAlex/fingerprint-oss/issues) or [PR](https://github.com/IntegerAlex/fingerprint-oss/pulls) with the `roadmap` label to propose changes to this plan.
