---
title: Introduction
description: Overview of the fingerprint-oss library, its purpose, and key features
---

# Introduction to fingerprint-oss

## What is fingerprint-oss?

Fingerprint-oss is a free and open-source JavaScript library that performs comprehensive device and browser fingerprinting entirely on the client side. It operates under the LGPL-3.0 license, making it a truly open-source alternative to commercial fingerprinting solutions.

## Key Features

- **Client-side Operation**: All processing happens in the browser
- **Comprehensive Fingerprinting**: Multiple detection mechanisms
- **Privacy-Conscious**: Built with privacy and compliance in mind
- **Modular Architecture**: Easy to extend and customize
- **GDPR Compliant**: Includes transparency features and consent management

## Core Capabilities

- **System Information**: Browser, OS, and hardware detection
- **Advanced Fingerprinting**: Canvas, WebGL, Audio, and Math constants
- **Privacy Detection**: Incognito mode, AdBlockers, and VPN detection
- **Network Analysis**: Geolocation and network characteristics
- **Confidence Scoring**: Reliability assessment of collected data

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

This project is licensed under the LGPL-3.0 License - see the [LICENSE](/fingerprint-oss-docs/license) file for details.
