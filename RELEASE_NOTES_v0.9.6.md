# Fingerprint OSS v0.9.6

**Release Date:** June 14, 2026

## Highlights

This release introduces **enhanced fingerprinting capabilities** with new audio, canvas, WebGL2, and spoofing detection modules, alongside critical security fixes and dependency updates.

---

## What's New

### Enhanced Fingerprinting Module
- **Audio v2**: Improved audio fingerprinting with pre-render checks and efficient Uint8Array hashing
- **Canvas v2**: Simplified 2-frame canvas stabilisation for more reliable fingerprints
- **WebGL2**: Extended WebGL fingerprinting support
- **Spoofing Detection**: New module to detect common browser fingerprint spoofing techniques

### Security & Infrastructure
- **Vulnerability Fixes**: Resolved all security vulnerabilities across demo, docs, and root packages
- **Lockfile Sync**: Regenerated all lockfiles for npm ci compatibility
- **Dependency Updates**: Updated protobufjs, axios, Next.js, and other dependencies to latest stable versions

### Demo Improvements
- **Footer Updates**: Updated demo footer links and branding
- **Audit Script**: Added audit script for dependency checking

---

## Changes

| Category | Description |
|----------|-------------|
| **Added** | Enhanced fingerprinting module (audio_v2, canvas_v2, WebGL2, spoofing detection) |
| **Fixed** | Security vulnerabilities across all packages |
| **Fixed** | Canvas stabilisation logic |
| **Changed** | Updated demo footer links and branding |
| **Changed** | Dependency updates (protobufjs, axios, Next.js, vite) |
| **Infrastructure** | Lockfile regeneration for npm ci compatibility |

---

## Installation

```bash
pnpm add fingerprint-oss@0.9.6
# or
npm install fingerprint-oss@0.9.6
# or
yarn add fingerprint-oss@0.9.6
```

---

## Links

- [GitHub Repository](https://github.com/IntegerAlex/fingerprint-oss)
- [npm](https://www.npmjs.com/package/fingerprint-oss)
- [License: LGPL-3.0](https://github.com/IntegerAlex/fingerprint-oss/blob/main/LICENSE.md)
