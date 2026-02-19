# Fingerprint OSS Roadmap

Planned releases and features for versions 0.9.5 through 0.9.7. Timeline and scope are subject to change based on community feedback and capacity.

---

## v0.9.5 — Robustness & Developer Experience

**Theme:** Stability, validation, and better tooling for integrators.

### Validation & Input Sanitization

- **Config validation** — Validate and sanitize `userInfo` config options; warn or error on invalid values
- **Output shape guards** — Ensure all optional fields have consistent fallbacks; no `undefined` in serialized output where a default is expected
- **Schema exports** — Export TypeScript/Zod schemas for output validation in consuming applications

### Error Handling & Resilience

- **Structured error types** — Introduce `FingerprintError` with codes (e.g. `GEO_FAILED`, `CANVAS_BLOCKED`) for programmatic handling
- **Graceful degradation flags** — Add `warnings` array to output when features fail (e.g. WebGL blocked, geolocation timeout)
- **Geolocation timeout config** — Allow `geoTimeout` in config for custom geolocation fetch timeout

### Developer Experience

- **npm `exports` field** — Proper package exports for ESM, CJS, and types
- **UMD global name** — Document and stabilize UMD bundle usage
- **Minimal config preset** — `userInfo({ preset: 'minimal' })` for privacy-first, reduced data collection
- **Integration tests** — Broader Cypress coverage for hash stability and cross-browser behavior

---

## v0.9.6 — Configuration & Extensibility

**Theme:** Flexibility for different deployment and compliance needs.

### Configuration

- **Custom geo endpoint** — `geoEndpoint` option to point to self-hosted or alternate geolocation proxy
- **Feature flags** — Opt-in/opt-out for modules (e.g. `disableCanvas`, `disableWebGL`, `disableDeviceType`) for privacy/performance trade-offs
- **Server-side config** — Support `userAgent` and `clientIp` in config for server-side fingerprinting

### Extensibility

- **Plugin / middleware hooks** — Lifecycle hooks (e.g. `beforeCollect`, `afterCollect`) for custom enrichment or filtering
- **Custom hash salt** — Optional salt for hash generation to support multi-tenant or rotated identifiers
- **Exported collectors** — Allow importing individual collectors for tree-shaking and custom pipelines

### Performance

- **Lazy module loading** — Defer loading heavy modules (e.g. Bowser, hash-wasm) until needed
- **Concurrent collection limits** — Configurable parallelism to avoid browser throttling
- **Bundle size reporting** — Add build script to report ESM/CJS/UMD sizes to CI

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

- **Stable output version** — Add `outputVersion` field for future schema evolution
- **Deprecation notices** — Clear deprecation path for legacy fields (e.g. `ip` alone) with migration docs
- **Documentation generation** — Auto-generate API docs from JSDoc/TypeScript for each release

### Pre-1.0 Checklist

- Audit all public APIs for stability guarantees
- Finalize breaking changes for 1.0
- Update NOTICE.md and compliance docs
- Performance and bundle size benchmarks

---

## Release Cadence

| Version | Target Focus           | Est. Timeline |
|--------|------------------------|---------------|
| 0.9.5  | Robustness & DX        | ~4–6 weeks    |
| 0.9.6  | Config & Extensibility | ~4–6 weeks    |
| 0.9.7  | Advanced & Hardening   | ~6–8 weeks    |

---

## Feedback

Suggestions and contributions are welcome. Open an [issue](https://github.com/IntegerAlex/fingerprint-oss/issues) or [PR](https://github.com/IntegerAlex/fingerprint-oss/pulls) with the `roadmap` label to propose changes to this plan.
