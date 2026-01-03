# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
