---
title: Fingerprinting Techniques
description: Comprehensive guide to the fingerprinting methods used in the library
---

# Fingerprinting Techniques

## Overview

Fingerprint-oss employs multiple techniques to create a unique device fingerprint. This document explains each technique, its implementation, and its reliability characteristics.

## Browser Detection

**Purpose**: Accurately identifies the browser and version using industry-standard parsing.

**How it works**:
1. Uses the Bowser library for comprehensive browser detection
2. Parses user-agent strings with high accuracy (98% for common browsers)
3. Supports 100+ browsers including Chrome, Firefox, Safari, Edge, Opera, Brave, and specialized browsers
4. Provides normalized browser names and version strings

**Example Output**:
```javascript
{
  browser: {
    name: "Chrome",
    version: "120.0.0.0"
  }
}
```

**Reliability**: Very High - Industry-standard parser with comprehensive browser support and accurate version detection.

## Core Fingerprinting Methods

### 1. Canvas Fingerprinting

**Purpose**: Creates a unique identifier based on how the browser renders 2D canvas elements.

**How it works**:
1. Draws a canvas with specific shapes and text
2. Applies transformations and colors
3. Exports the canvas to a data URL
4. Hashes the result to create a fingerprint

**Example Code**:
```javascript
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
// Draw operations...
const dataUrl = canvas.toDataURL();
const hash = await generateHash(dataUrl);
```

**Reliability**: High - Consistent across page refreshes but can be affected by browser extensions or privacy settings.

### 2. WebGL Fingerprinting

**Purpose**: Captures unique rendering characteristics of the WebGL implementation.

**How it works**:
1. Creates a WebGL context
2. Queries various WebGL parameters and capabilities
3. Combines these parameters into a hash

**Example Parameters**:
- `VENDOR`
- `RENDERER`
- `MAX_TEXTURE_SIZE`
- `SHADING_LANGUAGE_VERSION`

**Reliability**: High - Provides consistent results across sessions but can be spoofed.

### 3. Audio Fingerprinting

**Purpose**: Measures audio processing characteristics that are unique to each device.

**How it works**:
1. Creates an AudioContext
2. Generates an audio signal
3. Processes the signal through the Web Audio API
4. Analyzes the output for device-specific characteristics

**Reliability**: Medium - Can be affected by system load and audio processing settings.

### 4. Math Constants Fingerprinting

**Purpose**: Uses floating-point arithmetic variations across different CPUs.

**How it works**:
1. Performs mathematical operations with known results
2. Captures floating-point inaccuracies
3. Creates a signature from the results

**Example**:
```javascript
const mathFingerprint = {
  acosh: Math.acosh(1.123456789),
  asinh: Math.asinh(0.123456789),
  atanh: Math.atanh(0.123456789),
  expm1: Math.expm1(0.123456789),
  sinh: Math.sinh(0.123456789)
};
```

**Reliability**: Medium - Consistent on the same hardware but varies across different CPUs.

## Privacy Detection

### 1. Incognito Mode Detection

**Methods**:
- Checks for inconsistencies in storage quotas
- Tests for disabled APIs in private mode
- Verifies timing differences in storage operations

**Reliability**: High - Most modern browsers can be accurately detected.

### 2. Ad Blocker Detection

**Methods**:
- Attempts to load known ad scripts
- Checks for blocked requests
- Verifies the presence of ad-related DOM elements

**Reliability**: Medium - Can be affected by custom block lists.

### 3. VPN/Proxy Detection

**Methods**:
- Compares timezone with IP geolocation
- Checks for known VPN/Proxy IP ranges
- Analyzes network characteristics

**Reliability**: Medium - Can identify known VPNs but may have false positives.

## Confidence Scoring

Each detection method contributes to an overall confidence score (0-1) that indicates the reliability of the fingerprint.

### Factors Affecting Confidence:

1. **Browser Consistency**
   - Mismatch between user agent and platform
   - Inconsistent timezone information

2. **Privacy Tools**
   - Incognito/Private mode
   - VPN/Proxy usage
   - Ad blockers

3. **Data Anomalies**
   - Inconsistent hardware information
   - Unusual browser configurations
   - Signs of automation

### Calculating Confidence:

```javascript
function calculateConfidence(data) {
  let confidence = 1.0;
  
  // Reduce confidence for privacy tools
  if (data.privacy.isIncognito) confidence *= 0.8;
  if (data.privacy.adBlockers.length > 0) confidence *= 0.9;
  if (data.privacy.vpn.isVpn) confidence *= 0.85;
  
  // Check for inconsistencies
  if (hasInconsistentData(data)) confidence *= 0.7;
  
  return Math.max(0.1, Math.min(1.0, confidence));
}
```

## Best Practices

1. **Combine Multiple Techniques**
   - Use a combination of fingerprinting methods for better accuracy
   - Weight more reliable methods higher in your confidence calculations

2. **Handle False Positives**
   - Implement fallback identification methods
   - Use confidence scores to determine when to request additional authentication

3. **Respect User Privacy**
   - Be transparent about data collection
   - Provide opt-out mechanisms where possible
   - Comply with relevant privacy regulations

4. **Regular Updates**
   - Stay updated with browser changes that might affect fingerprinting
   - Update detection methods as browsers evolve their privacy protections
