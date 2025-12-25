---
title: API Reference
description: Comprehensive reference for the fingerprint-oss API, detailing the output structure, usage examples, and ethical considerations.
---

# API Reference

The `userInfo()` function returns a comprehensive object containing various data points about the user's system, browser, and environment. Here's a detailed breakdown of the output structure:

## Output Structure

### Confidence Assessment

```typescript
confidenceAssessment: {
  system: {
    score: number;          // 0-1 confidence score
    rating: string;         // Confidence rating (e.g., "Medium-High Confidence")
    description: string;    // Detailed description of confidence level
    reliability: string;    // Reliability assessment
    level: string;         // Confidence level category
    factors: string;       // Factors affecting confidence
  },
  combined: {
    score: number;         // Overall confidence score
    rating: string;        // Combined confidence rating
    description: string;   // Description of combined confidence
    reliability: string;   // Overall reliability assessment
    level: string;        // Combined confidence level
    factors: string;      // Factors affecting combined confidence
  }
}
```

### Geolocation Information

```typescript
geolocation: {
  vpnStatus: {
    vpn: {
      status: boolean;     // Whether VPN is detected
      probability: number; // Probability of VPN usage (0-1)
    }
  },
  ip: string;             // IP address
  city: string;           // City name
  region: {
    isoCode: string;      // Region ISO code
    name: string;         // Region name
  },
  country: {
    isoCode: string;      // Country ISO code
    name: string;         // Country name
  },
  continent: {
    code: string;         // Continent code
    name: string;         // Continent name
  },
  location: {
    accuracyRadius: number; // Location accuracy radius in kilometers
    latitude: number;      // Latitude
    longitude: number;     // Longitude
    timeZone: string;      // Timezone
  },
  traits: {
    isAnonymous: boolean;      // Whether the IP is anonymous
    isAnonymousProxy: boolean; // Whether using anonymous proxy
    isAnonymousVpn: boolean;   // Whether using anonymous VPN
    network: string;           // Network information
  }
}
```

### System Information

```typescript
systemInfo: {
  incognito: {
    isPrivate: boolean;    // Whether in private/incognito mode
    browserName: string;   // Browser name
  },
  adBlocker: {
    isBrave: boolean;     // Whether using Brave browser
    adBlocker: boolean;   // Whether ad blocker is detected
  },
  browser: {
    name?: string;        // Browser name (e.g., "Chrome", "Firefox", "Safari")
    version?: string;     // Browser version (e.g., "120.0.0.0")
  },
  userAgent: string;      // User agent string
  platform: string;       // Platform information
  languages: string[];    // Preferred languages
  cookiesEnabled: boolean; // Whether cookies are enabled
  doNotTrack: boolean | null; // Do Not Track setting
  screenResolution: [number, number]; // Screen resolution [width, height]
  colorDepth: number;     // Color depth
  colorGamut: string;     // Color gamut
  touchSupport: {
    maxTouchPoints: number; // Maximum touch points
    touchEvent: boolean;    // Touch event support
    touchStart: boolean;    // Touch start support
  },
  hardwareConcurrency: number; // Number of CPU cores
  deviceMemory: number;    // Device memory in GB
  os: {
    os: string;           // Operating system
    version: string;      // OS version
  },
  audio: null | object;   // Audio fingerprint
  localStorage: boolean;  // Local storage support
  sessionStorage: boolean; // Session storage support
  indexedDB: boolean;     // IndexedDB support
  webGL: {
    vendor: string;       // WebGL vendor
    renderer: string;     // WebGL renderer
  },
  canvas: {
    winding: boolean;     // Canvas winding
    geometry: string;     // Canvas geometry fingerprint
    text: string;         // Canvas text fingerprint
  },
  plugins: Array<{
    name: string;         // Plugin name
    description: string;  // Plugin description
    mimeTypes: Array<{
      type: string;       // MIME type
      suffixes: string;   // File suffixes
    }>
  }>,
  timezone: string;       // Timezone
  vendor: string;         // Browser vendor
  vendorFlavors: string[]; // Browser flavors
  mathConstants: {
    acos: number;         // Math.acos result
    acosh: number;        // Math.acosh result
    asinh: number;        // Math.asinh result
    atanh: number;        // Math.atanh result
    expm1: number;        // Math.expm1 result
    sinh: number;         // Math.sinh result
    cosh: number;         // Math.cosh result
    tanh: number;         // Math.tanh result
  },
  fontPreferences: {
    fonts: Array<{
      name: string;       // Font name
      width: number;      // Font width
    }>
  },
  bot: {
    isBot: boolean;       // Whether detected as bot
    signals: string[];    // Bot detection signals
    confidence: number;   // Bot detection confidence
  },
  confidenceScore: number; // Overall system confidence score
}
```

### Hash

```typescript
hash: string; // Unique device identifier hash
```

## Usage Examples

### Basic Usage

```javascript
import userInfo from 'fingerprint-oss';

const data = await userInfo();
console.log(data.hash); // Get unique device identifier
console.log(data.systemInfo.os); // Get OS information
console.log(data.systemInfo.browser); // Get browser information { name: "Chrome", version: "120.0.0.0" }
```

### With GDPR Compliance

```javascript
import userInfo from 'fingerprint-oss';

const config = {
  transparency: true,
  message: 'We collect device information to improve your experience'
};

const data = await userInfo(config);
```

## Ethical Considerations

When using this library, please consider the following ethical guidelines:

1.  **Transparency**: Always inform users about data collection
2.  **Purpose**: Only collect data necessary for your application
3.  **Consent**: Obtain proper consent before collecting data
4.  **Privacy**: Handle collected data securely and responsibly
5.  **Compliance**: Follow relevant privacy laws and regulations

For more information about ethical usage, please refer to our [Ethical Contribution Notice](https://github.com/IntegerAlex/fingerprint-oss/blob/main/NOTICE.md).
