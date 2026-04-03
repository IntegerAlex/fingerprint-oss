# Fingerprint OSS v0.9.5

**Release Date:** April 3, 2026

## Highlights

This release focuses on **robustness, developer experience (DX), and infrastructure**. We've introduced a structured error handling system, improved configuration validation with real-time warnings, and optimized our build pipeline for better performance and smaller distribution footprints.

---

## What's New

### Robust Configuration & Validation
Integration is now safer with a new configuration validation layer:
- **Normalization:** Automatically handles environment-specific defaults (TEST, DEV, STAGING, PROD).
- **Warnings Surface:** The `userInfo()` function now returns an optional `warnings` array, providing immediate feedback on invalid configuration or runtime hiccups (like geolocation timeouts).
- **Strict Mode Support:** Added internal hooks for stricter configuration checks to prevent silent failures.

### Structured Error Handling
We've migrated from generic errors to a typed `FingerprintError` system:
- **Error Codes:** Easily handle specific failure modes with codes like `CONFIG_INVALID`, `GEO_TIMEOUT`, `GEO_FETCH_FAILED`, and `SYSTEM_INFO_FAILED`.
- **Safe Fallbacks:** Improved fallback logic ensures that even if one collector fails, you still get a deterministic fingerprint with reduced confidence.

### Geolocation Enhancements
- **Timeout Support:** Added `geoTimeout` configuration to prevent slow geolocation requests from hanging your application.
- **Abortable Requests:** Uses modern `AbortController` for low-overhead request termination.
- **Better Connectivity Reporting:** Structured warnings when the geolocation API is unreachable or returns invalid data.

### Infrastructure & Build Improvements
- **pnpm Migration:** Switched to `pnpm` for faster, deterministic, and space-efficient dependency management.
- **Rollup Optimization:** Migrated to the official `@rollup/plugin-typescript` and added `tslib` to externalize TypeScript helpers, reducing the final bundle size.
- **Lean Distribution:** Refined the npm package to include only essential files, excluding source maps and internal metadata from production builds.

---

## Usage

```javascript
import userInfo from 'fingerprint-oss';

try {
  const data = await userInfo({
    geoTimeout: 5000,
    transparency: true
  });
  
  if (data.warnings) {
    console.warn('Fingerprint Warnings:', data.warnings);
  }
  
  console.log('ID:', data.hash);
} catch (error) {
  if (error.code === 'CONFIG_INVALID') {
    console.error('Check your config!', error.details);
  }
}
```

---

## Changes

| Category | Description |
|----------|-------------|
| **Added** | `FingerprintError` and `FingerprintWarning` types |
| **Added** | `geoTimeout` support for geolocation fetch |
| **Added** | `warnings` array in `userInfo()` output |
| **Changed** | Build pipeline migrated to `@rollup/plugin-typescript` and `tslib` |
| **Infrastructure** | Migrated from npm to `pnpm` |
| **Compatibility** | Fully backward compatible with v0.9.4 fingerprints |

---

## Installation

```bash
pnpm add fingerprint-oss@0.9.5
# or
npm install fingerprint-oss@0.9.5
# or
yarn add fingerprint-oss@0.9.5
```

---

## Documentation

- [API Reference](https://docs.fingerprint-oss.gossorg.in/docs/api/reference) — Configuration & Errors
- [Changelog](https://github.com/IntegerAlex/fingerprint-oss/blob/main/CHANGELOG.md)

---

## Links

- [GitHub Repository](https://github.com/IntegerAlex/fingerprint-oss)
- [npm](https://www.npmjs.com/package/fingerprint-oss)
- [License: LGPL-3.0](https://github.com/IntegerAlex/fingerprint-oss/blob/main/LICENSE.md)
