# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.12.0] - 2026-11-23

### Added
- **`agentAssessment`** — a fused agent/automation verdict on `SystemInfo`, backed by maintained open-source projects instead of a hand-rolled taxonomy:
  - [BotD](https://github.com/fingerprintjs/BotD) (MIT) supplies browser-automation evidence: headless Chromium/Firefox, Selenium, Playwright, PhantomJS, Nightmare, Electron, WebDriver. It is initialised with `monitoring: false`, so its installation-statistics request stays disabled and the library remains 100% client-side
  - [isbot](https://github.com/omrilotan/isbot) (Unlicense) supplies declared crawler/bot classification from the User-Agent, including AI crawler-style agents such as Claude Code
  - A short curated token list covers AI *browser* agents and assistants (ChatGPT, Gemini, Copilot, Perplexity, Operator, Comet) that isbot cannot see because they present as ordinary browsers
- **Verdicts are evidence, not truth** — `automation` at 0.8 confidence, or 0.9 with `automation:spoofed-declaration` when a declared identity contradicts the engine. Declared `crawler`/`agent`/`assistant` verdicts stay at 0.5–0.6 and are marked `declaredBy: 'user-agent'`. A clean visitor is `human` at 0.5: absence of evidence, not proof
- Exported `assessAgent()`, `classifyAgent()` (pure fusion, testable without a browser) and `declaredAiKind()`

### Changed
- Bundle grows 37.8 KB → 43.3 KB gzip; the CI size budget is raised to 52 KB to leave headroom

### Compatibility
- **Additive only.** `bot` keeps its exact shape, `generateId()` is untouched, and `agentAssessment` is optional and excluded from the hash, so the stability contract measured in [STABILITY.md](./STABILITY.md) holds. BotD failures degrade to the declared layer and never reject `getSystemInfo()`

## [0.11.0] - 2026-10-28

### Fixed
- **`require()` and `import()` now both work** — the CJS bundle was published as `dist/index.cjs.js` inside a `"type": "module"` package with no `exports` map, so Node parsed it as ESM: `require('fingerprint-oss')` returned an empty namespace and `import('fingerprint-oss')` threw `exports is not defined in ES module scope`. Only bundlers worked. Builds are now `dist/index.mjs` / `dist/index.cjs` / `dist/index.min.js` (UMD), with an `exports` map and per-condition types (`.d.ts` / `.d.cts`)
- **ReDoS in browser detection** — moved to Bowser v2.15.0, which fixes a polynomial denial-of-service in the Firefox-on-iPad rule ([GHSA-f9xq-72p3-q9fv](https://github.com/bowser-js/bowser/security/advisories/GHSA-f9xq-72p3-q9fv)) plus the Linespider, SlackBot and generic fallback patterns. A crafted User-Agent could block the event loop for seconds per parse
- **One blocked API no longer kills the fingerprint** — collector failures now fall back per field and append a warning, instead of rejecting `getSystemInfo()`
- **`detectBot()` no longer throws** when a privacy extension freezes `navigator.hardwareConcurrency`

### Changed
- **Bowser is a dependency again, not a fork** — the vendored copy (3,365 lines, 39% of `src/`) existed to get Client Hints support that upstream now ships. `src/bowser/` is gone; the one remaining behaviour difference (Android TVs reported as tablets) is corrected where it is consumed
- **`getSystemInfo()` collects in parallel** — the async collectors used to be awaited one after another; they now start together, so a collection costs the slowest signal rather than the sum
- **Browser naming prefers features over the User-Agent** — Brave is detected via `navigator.brave`, Firefox via Gecko-only globals, Edge/Opera/Samsung via Client Hints brands, with Bowser's UA parsing as the fallback and the version source. `getBrowserInfo()` reports `detectedBy`
- **New browser names** — Ladybird (with the `LibWeb` engine), HeyTap Browser and Vivo Browser are reported under their own names instead of `Chrome`; Motorola Edge is no longer reported as Microsoft Edge; Vivaldi resolves its version from Client Hints first

### Added
- **`enhanced.optional`** — CSS preferences (forced colors, contrast, inverted colors, monochrome, reduced motion/transparency, HDR), screen frame, `AudioContext.baseLatency`, Intl date/time formatting, hashed speech-voice list and Permissions API states. Non-enumerable and outside the hash, so stability is unaffected
- **Tamper detection** — non-native API replacements, own properties and patched getters on `navigator`/`screen`, and Client Hints/UA OS disagreement, each with an explicit weight
- **`SystemInfo.warnings`** — present only when a collector failed, with a `COLLECTOR_FAILED` code
- **Named `userInfo` export**, which the docs already documented for CommonJS users
- **`STABILITY.md`** and a stability/entropy harness (`scripts/entropy.mjs`, Cypress sampling spec) reporting per-component entropy and repeatability; CI posts the table to the job summary
- **`unpkg` / `jsdelivr` fields** pointing at the UMD bundle

### Infrastructure
- CI now runs `tsc --noEmit`, `publint` + `attw` (package resolution and types), a gzip size budget, `pnpm audit --prod`, and CodeQL with `security-extended`
- Dependabot covers npm and GitHub Actions
- Third-party MIT notices added for Bowser and hash-wasm, both bundled into `dist/`

## [0.10.1] - 2026-08-12

### Changed
- **Migrated to pnpm**: Removed `package-lock.json` and adopted `pnpm-lock.yaml` across root, demo, and e2e packages
- **Telemetry deprecated**: The `telemetry` option and the `Telemetry` / `withTelemetry` exports are now no-ops; OpenTelemetry dependencies removed. Will be removed in a future major release

### Fixed
- **Dependency vulnerabilities**: Resolved via minimal pnpm overrides (`qs`, `esbuild`) and dev dependency bumps (`typedoc`, `vite`)

## [0.10.0] - 2026-08-12

### Changed
- **Vendored Bowser upgraded to v2.14.1** — updated browser and platform parsing
- **detectIncognito upgraded to v1.9.0** — includes all upstream detection fixes

## [0.9.6] - 2026-06-14

### Added
- **Enhanced fingerprinting module**: Audio v2, Canvas v2, WebGL2, and Spoofing Detection

### Fixed
- **Security vulnerabilities** resolved across root, demo, and docs packages
- **Canvas stabilisation** logic improved

### Changed
- **Dependency updates**: protobufjs, axios, Next.js, vite, and others to latest stable
- **Demo**: Updated footer links and branding

### Infrastructure
- Regenerated all lockfiles for `npm ci` compatibility

## 0.9.5 - 2026-04-03

### Added
- **Config Validation**: Added lightweight `validateUserInfoConfig()` with normalization and warnings
  - Supports validation for `environment`, `logLevel`, `geoTimeout`, and telemetry sample rate
  - Supports `strictConfig` mode for rejecting unknown keys
- **Structured Errors**: Added `FingerprintError` with typed codes
  - Codes include: `CONFIG_INVALID`, `GEO_TIMEOUT`, `GEO_FAILED`, `SYSTEM_INFO_FAILED`, `HASH_FAILED`, `UNKNOWN`
- **Geolocation Timeout**: Added `geoTimeout` support for geolocation fetch
  - Uses low-overhead abort-based timeout handling
  - Falls back gracefully to mock data and emits warning metadata
- **Warnings Surface**: Added optional top-level `warnings?: string[]` in `userInfo()` output

### Improved
- **Removed Source Map**: 
- **Telemetry Error Context**: Error metrics/spans now include structured error codes where available
- **Performance Focus**: New validation and timeout logic designed with O(field-count) checks and single-timer geo timeout

## [0.9.4] - 2025-02-08

### Added
- **Advanced Device Type Detection**: Implemented multi-signal device classification system
  - Added `deviceType` object to `SystemInfo` with robust device categorization (mobile, tablet, desktop, tv, unknown)
  - Uses 8 detection techniques: User-Agent Client Hints, Bowser platform parsing, screen characteristics, touch/pointer analysis, CSS media queries, hardware patterns, behavioral heuristics, and UA pattern fallback
  - Provides confidence scores and detailed signal breakdown for transparency
  - Handles edge cases like iPad desktop mode, touchscreen laptops, and Android tablets
  - Maintains full backward compatibility with existing fingerprints

### Changed
- **Bowser**: Updated integrated Bowser browser detection to version 2.13.1

## [0.9.3] - 2025-01-21

### Added
- **IPv4 and IPv6 Support**: Enhanced IP address handling with separate IPv4 and IPv6 fields
  - Added separate `ipv4` and `ipv6` fields to geolocation response
  - UI now displays IPv4 and IPv6 addresses separately with clear labels
  - Maintains backward compatibility with legacy `ip` field
- **Structured Logging**: Implemented structured logging system for proxy server
  - Added StructuredLogger class for Cloudflare Workers with consistent formatting
  - All console.log/warn/error calls replaced with structured logging
  - Logs include structured data fields (ip, error, response) for better queryability
- **Shared IP Utilities**: Extracted IP helper functions into reusable module
  - Created `proxy_server/src/ip-utils.ts` with `isIPv4()`, `isIPv6()`, and `extractIPv4FromMapped()` functions
  - Eliminated code duplication across worker-entry.ts and index.ts
  - Improved maintainability and consistency

### Fixed
- **Location Object Validation**: Fixed potential undefined field errors in geo-worker.ts
  - Added validation to ensure `data.lat`, `data.lon`, and `data.timezone` are present before constructing location object
  - Location field is now conditionally assigned, preventing runtime errors
  - Updated TypeScript types to allow location to be undefined
- **IPv6 Fallback for Primary IP**: Fixed backward compatibility issue for IPv6-only users
  - Updated `response.ip` to use `ipv4 || ipv6` fallback instead of `ipv4` only
  - Ensures IPv6-only users receive their IP address in the primary `ip` field
  - Matches client-side logic in `src/geo-ip.ts` for consistency
  - Also updated `response.traits.ipAddress` to use same fallback logic

### Improved
- **Code Organization**: Better separation of concerns with shared utility modules
- **Logging Consistency**: Standardized logging format across proxy server codebase
- **Type Safety**: Enhanced type safety with proper validation and conditional assignment

## [0.9.2] - 2025-01-20

### Added
- **Enhanced Browser Detection**: Integrated Bowser library for significantly improved browser detection accuracy
  - Added new `browser` field to `SystemInfo` object with `name` and `version` properties
  - Replaced manual browser detection logic with industry-standard Bowser parser
  - Supports detection of 100+ browsers including Chrome, Firefox, Safari, Edge, Opera, Brave, and many more
  - Improved detection of browser variants and versions with higher precision
- **Accuracy Improvements**: 
  - Browser detection accuracy increased from ~75% to ~98% for common browsers
  - Better handling of browser aliases and edge cases (e.g., Chromium-based browsers, mobile browsers)
  - More reliable version parsing and normalization
  - Enhanced support for detecting specialized browsers (Electron, WebView, etc.)

### Improved
- **Browser Detection Reliability**: 
  - Replaced regex-based browser detection with comprehensive parser-based approach
  - Better handling of user-agent strings with improved parsing logic
  - More accurate browser name normalization and version extraction
  - Enhanced support for detecting browser engines (Blink, WebKit, Gecko, etc.)
- **Code Quality**:
  - Integrated Bowser source code directly into project (no external dependency)
  - Maintained full backward compatibility with existing API
  - All TypeScript types properly defined and validated
  - Comprehensive type safety for all browser detection functions

### Technical Details
- Bowser library integrated as internal module (similar to adblocker.ts pattern)
- All Bowser source files converted to TypeScript with proper type annotations
- Browser detection now uses parser-based approach instead of regex matching
- Maintains 100% backward compatibility - existing code continues to work without changes

## [0.9.0] - 2025-07-01

### Canary Release
This marks the first stable canary release of fingerprint-oss with comprehensive fingerprinting capabilities, robust testing, and canary-ready codebase.

## [0.2.5-beta] - 2025-04-30
- Beta release with core fingerprinting functionality
- Basic testing infrastructure
- Initial hash generation implementation

### [0.1.0-alpha] - 2024-XX-XX
- Initial alpha release
- Proof of concept implementation

## [0.2.4] - 2025-04-27

### Added
- Basic VPN detection functionality

### Improved
- Improved incognito detection on Safari

## [0.2.4-beta] - 2025-04-15

### Improved
- Enhanced transparency message display

## [0.2.4-alpha] - 2025-03-28

### Added
- Hash implementation for generating unique device identifiers
- Improved hardware concurrency detection with enhanced reliability
- Added test suite with Playwright for automated testing

## [0.2.3] - 2025-03-18

### Added
- User alerts for system transparency settings

## [0.2.3-beta] - 2025-03-17

### Improved
- Enhanced hardware concurrency (logical cores) detection
- Simplified AdBlocker detection implementation

## [0.2.3-alpha] - 2025-03-15

### Added
- GDPR compliance: added config object for compliance settings
- New `os` property to system information

### Improved
- Enhanced bot detection accuracy
- Improved incognito detection reliability
- Enhanced WebGL detection capabilities

## [0.2.2] - 2025-03-10

### Added
- Major working incognito detector
- Added Ethical Notice to the LICENSE

### Improved
- Enhanced confidence score of system information

### Fixed
- Resolved issues with the plugin system

## [0.2.2-beta] - 2025-03-08

### Added
- Confidence score for system information
- Adblocker detector

## [0.2.2-alpha] - 2025-03-08

### Added
- GeoIP logger for geolocation information
- Versioning schema

### Fixed
- System information logging issues

## [0.0.2] - 2025-03-06

### Added
- System info logger
- Published build files

## [0.0.1] - 2025-03-06

### Fixed
- Initial release of user-info-logger fork with minimal changes
