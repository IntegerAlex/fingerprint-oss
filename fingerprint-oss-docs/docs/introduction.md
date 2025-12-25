---
title: Introduction
description: Overview of the fingerprint-oss library, its purpose, and key features
---

# Introduction to Fingerprint-OSS

## What is Fingerprint-oss?

Fingerprint OSS is a comprehensive JavaScript library for device fingerprinting and system information collection that provides robust, deterministic fingerprinting for web applications with privacy-conscious design. It's a free and open source fingerprinting service released under the LGPL-3.0 license, positioned as an alternative to commercial solutions like FingerprintJS.

## Why Fingerprint-OSS?

- Open source alternative to commercial solutions
- Privacy-conscious design with GDPR compliance
- Deterministic and reliable fingerprinting
- Easy integration and modern architecture
- Enterprise backing and active development

## Key Features

- **Client-side Operation**: All processing happens in the browser
- **Comprehensive Fingerprinting**: Multiple detection mechanisms
- **Privacy-Conscious**: Built with privacy and compliance in mind
- **Modular Architecture**: Easy to extend and customize
- **GDPR Compliant**: Includes transparency features and consent management

## Core Capabilities

- **System Information**: Enhanced browser detection (98% accuracy), OS, and hardware detection
- **Advanced Fingerprinting**: Canvas, WebGL, Audio, and Math constants
- **Privacy Detection**: Incognito mode, AdBlockers, and VPN detection
- **Network Analysis**: Geolocation and network characteristics
- **Confidence Scoring**: Reliability assessment of collected data
- **Browser Detection**: Industry-standard parser supporting 100+ browsers with high accuracy

## Quick Start

```javascript
import userInfo from 'fingerprint-oss';

// Basic usage
const data = await userInfo();
console.log('Device ID:', data.hash);

// With GDPR compliance options
const config = {
    transparency: true,
    message: 'Custom message about data collection'
};
const dataWithConfig = await userInfo(config);
```

## License

This project is licensed under the LGPL-3.0 License - see the [LICENSE](/license) file for details.
