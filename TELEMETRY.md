# OpenTelemetry Integration - Usage Examples

This document provides examples of how to use the new OpenTelemetry integration in fingerprint-oss.

## Important: OpenTelemetry Exporter Configuration

**⚠️ Note**: The fingerprint-oss library provides telemetry data collection but **does not include an exporter**. To actually send telemetry data to your monitoring system, you must configure an OpenTelemetry exporter in your application:

```javascript
// Example: Configure exporter in your application
import { NodeSDK } from '@opentelemetry/auto-instrumentation-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-otlp-http';

// Configure your own exporter
const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'your-app',
    [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
  }),
  traceExporter: new OTLPTraceExporter({
    url: 'https://your-jaeger-or-otel-endpoint/v1/traces',
  }),
});

sdk.start();

// Now fingerprint-oss telemetry will be exported to your system
import userInfo from 'fingerprint-oss';
```

## Basic Usage

```javascript
import userInfo from 'fingerprint-oss';

// Basic fingerprinting with telemetry disabled (default)
const data = await userInfo();
```

## Enable Telemetry

```javascript
import userInfo from 'fingerprint-oss';

// Enable telemetry with minimal configuration
const config = {
  transparency: true,
  message: 'We collect device information for security purposes',
  telemetry: {
    enabled: true,
    serviceName: 'my-app',
    serviceVersion: '1.0.0',
    sampleRate: 0.1, // Collect 10% of events
    debug: false
  }
};

const data = await userInfo(config);
```

## Advanced Telemetry Configuration

```javascript
import userInfo, { Telemetry, withTelemetry } from 'fingerprint-oss';

// Initialize telemetry globally
Telemetry.initialize({
  enabled: true,
  serviceName: 'fingerprint-app',
  serviceVersion: '2.0.0',
  sampleRate: 0.05, // Only 5% sampling for production
  debug: process.env.NODE_ENV === 'development'
});

// Use the decorator for custom functions
const myCustomFingerprinting = withTelemetry('customFingerprint', async () => {
  const data = await userInfo();
  // Additional custom processing
  return {
    ...data,
    customField: 'value'
  };
});

// Manual telemetry recording
const span = Telemetry.startSpan('user-authentication');
try {
  const fingerprintData = await userInfo();
  const authResult = await authenticateUser(fingerprintData);
  
  Telemetry.endSpan(span, {
    'auth.success': authResult.success,
    'user.id': authResult.userId
  });
  
  return authResult;
} catch (error) {
  Telemetry.recordError(error, {
    'operation': 'user-authentication'
  });
  Telemetry.endSpanWithError(span, error);
  throw error;
}
```

## Production Considerations

### Sample Rate Configuration

For production environments, use a low sample rate to minimize performance impact:

```javascript
const prodConfig = {
  telemetry: {
    enabled: true,
    sampleRate: 0.01, // Only 1% of requests
    debug: false,
    serviceName: 'production-app',
    serviceVersion: process.env.APP_VERSION
  }
};
```

### Privacy-Conscious Implementation

The telemetry system is designed to respect user privacy:

```javascript
const privacyConfig = {
  transparency: true, // Always inform users
  message: 'This website collects anonymous usage statistics to improve performance',
  telemetry: {
    enabled: true,
    sampleRate: 0.05,
    // No personal data is collected - only execution metrics
    debug: false
  }
};
```

## Metrics Collected

The telemetry system collects the following types of data:

1. **Function Execution Metrics**
   - Execution time
   - Success/failure rates
   - Function call counts

2. **Error Information**
   - Error types and messages
   - Error context and stack traces
   - Error frequency patterns

3. **Performance Data**
   - Response times
   - System resource usage
   - Data collection efficiency

4. **Usage Analytics**
   - Feature utilization
   - API endpoint usage
   - Configuration patterns

## Integration with Monitoring Systems

The OpenTelemetry data can be exported to various monitoring systems:

```javascript
// Example configuration for different backends
const telemetryConfigs = {
  // For Jaeger
  jaeger: {
    enabled: true,
    endpoint: 'http://localhost:14268/api/traces',
    serviceName: 'fingerprint-service'
  },
  
  // For Zipkin
  zipkin: {
    enabled: true,
    endpoint: 'http://localhost:9411/api/v2/spans',
    serviceName: 'fingerprint-service'
  },
  
  // For custom OTLP endpoint
  custom: {
    enabled: true,
    endpoint: 'https://api.your-monitoring-service.com/v1/traces',
    serviceName: 'fingerprint-service'
  }
};
```

## Best Practices

1. **Start with Low Sample Rates**: Begin with 1-5% sampling in production
2. **Monitor Performance Impact**: Track the overhead of telemetry collection
3. **Use Debug Mode in Development**: Enable debug logging during development
4. **Configure Appropriate Service Names**: Use descriptive service names for better organization
5. **Implement Error Handling**: Always handle telemetry errors gracefully
6. **Respect User Privacy**: Be transparent about data collection

## Troubleshooting

### Common Issues

1. **Telemetry Not Working**: Ensure `enabled: true` is set in configuration
2. **No Data Collected**: Check sample rate - may be too low
3. **Performance Issues**: Reduce sample rate or disable in development
4. **Build Errors**: Ensure all OpenTelemetry dependencies are installed

### Debug Information

Enable debug mode to see telemetry operations:

```javascript
Telemetry.initialize({
  enabled: true,
  debug: true, // Enable debug logging
  sampleRate: 1.0 // 100% sampling for debugging
});
```

This will log telemetry operations to the browser console for debugging purposes.

## Environment Compatibility

### Browser vs Server-Side Rendering (SSR)

The fingerprint-oss telemetry system is designed primarily for browser environments and uses browser-specific OpenTelemetry packages:

- `@opentelemetry/sdk-trace-web` - Browser-optimized tracing
- `@opentelemetry/core` - Core OpenTelemetry functionality
- `@opentelemetry/resources` - Resource detection

### Node.js/SSR Considerations

When using fingerprint-oss in Server-Side Rendering (SSR) environments like Next.js or Nuxt.js:

1. **Client-Side Only**: Initialize telemetry only on the client-side to avoid SSR hydration mismatches:

```javascript
// Next.js example
import { useEffect } from 'react';
import { Telemetry } from 'fingerprint-oss';

function MyApp() {
  useEffect(() => {
    // Only initialize on client-side
    if (typeof window !== 'undefined') {
      Telemetry.initialize({
        enabled: true,
        serviceName: 'my-nextjs-app',
        sampleRate: 0.1
      });
    }
  }, []);
}
```

2. **Server-Side Telemetry**: If you need telemetry in server environments, configure your application's OpenTelemetry instrumentation separately using Node.js-specific packages like `@opentelemetry/sdk-node` rather than relying on fingerprint-oss telemetry.
