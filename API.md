# API Documentation

## Output Structure

The `userInfo()` function returns a comprehensive object containing various data points about the user's system, browser, and environment. Here's a detailed breakdown of the output structure:

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

### With OpenTelemetry Integration

```javascript
import userInfo from 'fingerprint-oss';

const config = {
  transparency: true,
  message: 'We collect device information to improve your experience',
  telemetry: {
    enabled: true,
    serviceName: 'my-fingerprint-service',
    serviceVersion: '1.0.0',
    sampleRate: 0.1, // Sample 10% of requests
    debug: false
  }
};

const data = await userInfo(config);
```

### Advanced Telemetry Usage

```javascript
import userInfo, { Telemetry, withTelemetry } from 'fingerprint-oss';

// Initialize telemetry separately
Telemetry.initialize({
  enabled: true,
  serviceName: 'my-app',
  sampleRate: 0.05 // Only 5% sampling for production
});

// Use telemetry decorator for custom functions
const myFunction = withTelemetry('myCustomFunction', async () => {
  return await userInfo();
});

// Manual telemetry recording
const span = Telemetry.startSpan('custom-operation');
try {
  const result = await userInfo();
  Telemetry.endSpan(span);
  return result;
} catch (error) {
  Telemetry.recordError(error);
  Telemetry.endSpanWithError(span, error);
  throw error;
}
```

## Telemetry Configuration

The telemetry system uses OpenTelemetry to provide observability into the fingerprinting process. This helps with:

- **Error Tracking**: Identify patterns in failed fingerprint attempts
- **Performance Monitoring**: Track execution times and performance bottlenecks
- **Usage Analytics**: Understand how the library is being used
- **Quality Assurance**: Monitor the reliability of fingerprint data

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | false | Enable/disable telemetry collection |
| `serviceName` | string | 'fingerprint-oss' | Service name for telemetry |
| `serviceVersion` | string | '0.9.0' | Service version |
| `endpoint` | string | undefined | Custom endpoint for telemetry export |
| `sampleRate` | number | 0.1 | Sample rate (0.0 to 1.0) |
| `debug` | boolean | false | Enable debug logging |

### Privacy Considerations

The telemetry system is designed with privacy in mind:

- **Minimal Data Collection**: Only collects execution metrics, error patterns, and performance data
- **No Personal Information**: Does not collect or transmit any personally identifiable information
- **Sampling**: Uses configurable sampling to minimize data collection
- **Opt-in**: Telemetry is disabled by default and must be explicitly enabled
- **Transparent**: All collected data types are documented and configurable

## Ethical Considerations

When using this library, please consider the following ethical guidelines:

1. **Transparency**: Always inform users about data collection
2. **Purpose**: Only collect data necessary for your application
3. **Consent**: Obtain proper consent before collecting data
4. **Privacy**: Handle collected data securely and responsibly
5. **Compliance**: Follow relevant privacy laws and regulations
6. **Telemetry Ethics**: If using telemetry, ensure compliance with your organization's data policies

For more information about ethical usage, please refer to our [Ethical Contribution Notice](./NOTICE.md). 