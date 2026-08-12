# fingerprint-oss OTL Server — DEPRECATED

> ⚠️ **This package is deprecated and no longer maintained.**

`fingerprint-oss` deprecated its built-in telemetry integration in
[v0.10.1](https://github.com/IntegerAlex/fingerprint-oss/releases/tag/v0.10.1):
the `telemetry` option and the `Telemetry` / `withTelemetry` exports are now no-ops,
and OpenTelemetry dependencies were removed from the library bundle. As a result, this
standalone OpenTelemetry OTLP receiver and storage server has no consumer and is retired.

## What this was

A reference Express + OpenTelemetry OTLP receiver that persisted traces/spans to
PostgreSQL. It was used to collect telemetry emitted by `fingerprint-oss`.

## Do not use

- No new projects should depend on this package.
- It will not receive further updates or security fixes. The outstanding `pnpm audit`
  findings (dev-only `vitest` / `vite` / `esbuild`, plus runtime `@opentelemetry/core`)
  are intentionally left unpatched because the package is deprecated.

## Migration

If you need telemetry, instrument your own OpenTelemetry pipeline directly — this server
is not a supported path.
