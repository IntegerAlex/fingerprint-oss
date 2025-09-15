---
title: Telemetry (OpenTelemetry)
description: How to enable telemetry in fingerprint-oss and where data is sent
---

# Telemetry (OpenTelemetry)

Fingerprint-OSS provides optional telemetry to help you monitor usage and errors. Telemetry is disabled by default.

## Enabling Telemetry

```ts
import { Telemetry } from 'fingerprint-oss';

Telemetry.initialize({
  enabled: true,
  serviceName: 'your-app',
  serviceVersion: '0.9.1',
  sampleRate: 0.1
});
```

## Endpoint

By default, traces are exported over OTLP/HTTP to:

- `domain/v1/traces`

No authorization is required. You can override the endpoint by passing `endpoint` in your telemetry config if you self-host a collector.

## What’s collected

- Span names for major operations
- Errors (without PII)
- Timing and basic attributes for performance insights

## Privacy

- Off by default
- No PII is included
- Configurable sampling via `sampleRate`
