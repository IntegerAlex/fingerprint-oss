# Security Policy

## Supported versions

Only the latest published minor receives security fixes. Older minors are
supported on a best-effort basis for critical issues.

| Version | Supported |
|---|---|
| 0.12.x | ✅ |
| 0.11.x | ⚠️ critical fixes only |
| ≤ 0.10 | ❌ |

## Reporting a vulnerability

**Do not open a public issue.**

Use GitHub's private reporting flow:
https://github.com/IntegerAlex/fingerprint-oss/security/advisories/new

Please include:

- affected version(s) and the exact function or output field
- a minimal reproduction (a User-Agent string, URL, or code snippet)
- the impact you believe it has, and whether it is client-side, build-time, or
  supply-chain

### What to expect

| Stage | Target |
|---|---|
| Acknowledgement | 3 business days |
| Initial assessment | 7 business days |
| Fix or mitigation for confirmed issues | 30 days for high/critical |

Reporters are credited in the advisory and release notes unless they ask not
to be.

## Scope

In scope:

- the published `fingerprint-oss` package and its bundles (`dist/`)
- the geolocation proxy that ships with the repository (`proxy_server/`)
- build and release configuration in this repository

Out of scope:

- vulnerabilities in third-party dependencies that already have an upstream
  advisory (we track these through Dependabot, `pnpm audit --prod` and CodeQL;
  report them upstream instead)
- findings that require the visitor to control their own browser in ways that
  only affect their own fingerprint
- denials of service against the demo site

## Hardening already in place

- CodeQL (`security-extended`) on push, pull request and weekly
- Dependabot for npm and GitHub Actions
- gzip bundle-size budget in CI
- release builds published with npm provenance
- a ReDoS fix lineage: Bowser 2.15.0 and this project's own regexes are covered
  by CodeQL's polynomial-backtracking queries
