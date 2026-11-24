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
1. Feature probes and Client Hints decide first: Brave via `navigator.brave`, Firefox via Gecko-only globals, Edge/Opera/Samsung via `userAgentData.brands`
2. Bowser 2.15.1 parses the User-Agent as the fallback and supplies the version string
3. `getBrowserInfo()` reports `detectedBy`, so you can see which source named the browser
4. A UA rewrite is reconciled rather than trusted: a Gecko engine behind a Chrome UA is reported as Firefox

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

## Agent and Automation Detection

Classic fingerprinting answers "which device is this?". In the agentic web it also
has to answer "is this a person at all?" — more than half of internet traffic is
now non-human, while only a small share of AI traffic declares itself.

`agentAssessment` fuses three layers into one verdict:

| Layer | Source | Answers |
|---|---|---|
| Automation | BotD (MIT) | Is the browser actually automated? Headless, Selenium, Playwright, PhantomJS, Nightmare, Electron, WebDriver |
| Declaration | isbot (Unlicense) | Does the User-Agent claim to be a crawler or bot? |
| Declaration | Curated tokens | AI browser agents isbot cannot see: ChatGPT, Gemini, Copilot, Perplexity, Operator, Comet |
| Consistency | This library | Prototype tamper, Client Hints/UA disagreements, renderer/OS contradictions |

### Evidence, not truth

- `automation` at 0.8 is automation evidence regardless of what the UA says.
- `automation` at 0.9 with `automation:spoofed-declaration` is a crawler UA inside
  an automated browser — crawlers do not execute JavaScript.
- `crawler` / `agent` / `assistant` are self-declared and marked
  `declaredBy: 'user-agent'`; a crawler is not automatically hostile.
- `human` at 0.5 is the absence of evidence. There is no client-side tell for a
  user-driven browser agent with a clean UA, and the library says so rather than
  guessing.

### Evasion

A stealth plugin can hide `navigator.webdriver`, fake plugins and the `chrome`
object, and rewrite UA and Client Hints to a Windows desktop. BotD then reports
nothing, so two contradictions are fused in:

1. **Core-count mismatch** — the reported `hardwareConcurrency` disagrees with
   measured throughput by 2× or more (stealth reports 4, the benchmark measures 8).
2. **Renderer/OS mismatch** — the UA says Windows while WebGL reports macOS-only
   strings (`Intel Inc.`, `Intel Iris OpenGL Engine`).

Either contradiction plus a headless signal escalates to `automation` at 0.7.
Single weak signals (a fullscreen kiosk, a phone with throttled cores) are
recorded in `signals` but never flip the verdict.

### Treating the verdict

```javascript
const { agentAssessment } = await getSystemInfo();
if (agentAssessment?.verdict === 'automation' && agentAssessment.confidence >= 0.8) {
  // require a challenge before accepting the request
}
```

Never block on `crawler` alone: search engines and AI crawlers legitimately
declare themselves, and blocking them removes you from their answers. The
`signals` array tells you *which* evidence fired, so policy can distinguish a
declared crawler from a spoofed one.

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
