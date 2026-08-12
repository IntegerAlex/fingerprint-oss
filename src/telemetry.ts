/*!
 * Copyright (c) 2025 Akshat Kotpalliwar (alias IntegerAlex on GitHub)
 * This software is licensed under the GNU Lesser General Public License (LGPL) v3 or later.
 *
 * Telemetry module for fingerprint-oss
 *
 * @deprecated Telemetry / OpenTelemetry integration is deprecated and is now a no-op.
 * The `@opentelemetry/*` dependencies have been dropped. Calls to the Telemetry API are
 * accepted for backward compatibility but do nothing and will be removed in a future
 * major release.
 */

import { StructuredLogger } from './config';

/**
 * @deprecated Telemetry configuration. The telemetry feature is deprecated and inert.
 */
export interface TelemetryConfig {
    /** Enable/disable telemetry collection */
    enabled?: boolean;
    /** Custom service name for telemetry */
    serviceName?: string;
    /** Custom service version */
    serviceVersion?: string;
    /** Endpoint for telemetry data export */
    endpoint?: string;
    /** Sample rate (0.0 to 1.0) for telemetry collection */
    sampleRate?: number;
    /** Enable debug logging */
    debug?: boolean;
}

/**
 * @deprecated Placeholder for the OpenTelemetry Span type. No longer backed by @opentelemetry.
 */
export type Span = unknown;

const NOOP_CONFIG: TelemetryConfig = { enabled: false };

let warned = false;
function deprecationWarning(): void {
    if (warned) return;
    warned = true;
    StructuredLogger.warn(
        'Telemetry',
        'Telemetry / OpenTelemetry integration is deprecated and is now a no-op. It will be removed in a future release.'
    );
}

/**
 * @deprecated Use of the Telemetry API is deprecated; all methods are no-ops.
 */
export const Telemetry = {
    initialize(_config: TelemetryConfig = {}): void {
        deprecationWarning();
    },
    startSpan(_name: string, _attributes?: Record<string, any>): Span | null {
        deprecationWarning();
        return null;
    },
    endSpan(_span: Span | null, _attributes?: Record<string, any>): void {
        deprecationWarning();
    },
    endSpanWithError(_span: Span | null, _error: Error, _attributes?: Record<string, any>): void {
        deprecationWarning();
    },
    recordError(_error: Error, _context?: Record<string, any>): void {
        deprecationWarning();
    },
    recordFunctionCall(_functionName: string, _executionTime: number, _success: boolean, _context?: Record<string, any>): void {
        deprecationWarning();
    },
    incrementCounter(_name: string, _value?: number, _attributes?: Record<string, any>): void {
        deprecationWarning();
    },
    recordHistogram(_name: string, _value: number, _attributes?: Record<string, any>): void {
        deprecationWarning();
    },
    isEnabled(): boolean {
        return false;
    },
    getConfig(): TelemetryConfig {
        return { ...NOOP_CONFIG };
    }
};

/**
 * @deprecated Pass-through decorator. Returns the original function unchanged.
 */
export function withTelemetry<T extends (...args: any[]) => any>(_functionName: string, originalFunction: T): T {
    deprecationWarning();
    return originalFunction;
}

export default Telemetry;
