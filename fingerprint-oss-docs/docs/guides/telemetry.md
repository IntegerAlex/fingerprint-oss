---
title: Telemetry (deprecated)
description: Telemetry is a no-op since 0.10.1 and will be removed in a future major release
---

# Telemetry (deprecated)

Telemetry is **disabled and inert**. Since 0.10.1 the `telemetry` option and the
`Telemetry` / `withTelemetry` exports are no-ops: calls are accepted so existing
code keeps working, but nothing is collected, exported or sent.

## What changed

| Version | Behaviour |
|---|---|
| ≤ 0.10.0 | optional OpenTelemetry export over OTLP/HTTP |
| ≥ 0.10.1 | no-op; the OpenTelemetry dependencies were removed |
| next major | exports removed |

## Migrating

If your code passes a telemetry config, delete it:

```diff
- const data = await userInfo({
-   telemetry: { enabled: true, serviceName: 'your-app', sampleRate: 0.1 },
- });
+ const data = await userInfo();
```

If you relied on the traces, instrument your own call site with your
OpenTelemetry SDK — fingerprint-oss emits nothing.

## Why

The library is client-side only and is positioned as privacy-conscious; shipping
an opt-in exporter that most integrators never enabled added dependencies and
code for no measurable benefit. Removing it also removed its transitive
dependency surface.
