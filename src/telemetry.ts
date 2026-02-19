/*!
 * Copyright (c) 2025 Akshat Kotpalliwar (alias IntegerAlex on GitHub)
 * This software is licensed under the GNU Lesser General Public License (LGPL) v3 or later.
 *
 * Telemetry module for fingerprint-oss
 * Provides minimal OpenTelemetry integration for error tracking and usage analytics
 */

import { 
    trace, 
    metrics, 
    SpanKind, 
    SpanStatusCode,
    Span,
    Tracer,
    Meter,
    Counter,
    Histogram
} from '@opentelemetry/api';
import { StructuredLogger } from './config';

/**
 * Telemetry configuration interface
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
 * Default telemetry configuration
 */
const DEFAULT_CONFIG: TelemetryConfig = {
    enabled: false,
    serviceName: 'fingerprint-oss',
    serviceVersion: '0.9.3',
    sampleRate: 0.1, // Collect 10% of events by default for minimal impact
    debug: false,
    endpoint: 'https://otl.fingerprint.gossorg.in/v1/traces'
};

/**
 * Internal telemetry state
 */
class TelemetryManager {
    private config: TelemetryConfig;
    private tracer: Tracer | null = null;
    private meter: Meter | null = null;
    private initialized = false;
    private counters: Map<string, Counter> = new Map();
    private histograms: Map<string, Histogram> = new Map();

    constructor() {
        this.config = { ...DEFAULT_CONFIG };
    }

    /**
     * Initialize telemetry with configuration
     */
    public initialize(config: TelemetryConfig = {}): void {
        this.config = { ...DEFAULT_CONFIG, ...config };
        
        if (!this.config.enabled) {
            return;
        }

        try {
            // Only initialize if running in browser environment
            if (typeof window === 'undefined') {
                return;
            }

            // Attempt to register a WebTracerProvider and exporter when available
            // This is best-effort and fully optional. Tests and apps without SDK/exporters won't fail.
            try {
                // Dynamically import to avoid bundling in SSR/non-browser contexts
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                // @ts-ignore - dynamic at runtime, optional dep
                import('@opentelemetry/sdk-trace-web').then(async (traceWeb) => {
                    const provider: any = new traceWeb.WebTracerProvider();

                    // If an endpoint is provided, attempt to set up OTLP HTTP exporter
                    if (this.config.endpoint) {
                        try {
                            const [{ OTLPTraceExporter }, traceBase] = await Promise.all([
                                // @ts-ignore - optional dep
                                import('@opentelemetry/exporter-trace-otlp-http'),
                                // @ts-ignore - optional dep
                                import('@opentelemetry/sdk-trace-base')
                            ]);
                            const exporter = new OTLPTraceExporter({ url: this.config.endpoint });
                            const processor = new (traceBase as any).BatchSpanProcessor(exporter);
                            (provider as any).addSpanProcessor(processor);
                        } catch (e) {
                            if (this.config.debug) {
                                StructuredLogger.warn('Telemetry', 'OTLP exporter setup skipped', e);
                            }
                        }
                    }

                    provider.register();
                    if (this.config.debug) {
                        StructuredLogger.debug('Telemetry', 'WebTracerProvider registered');
                    }
                }).catch(() => {
                    // sdk-trace-web not present - safe to ignore
                });
            } catch (e) {
                if (this.config.debug) {
                    StructuredLogger.warn('Telemetry', 'Provider registration skipped', e);
                }
            }

            // Initialize tracer
            this.tracer = trace.getTracer(
                this.config.serviceName!,
                this.config.serviceVersion!
            );

            // Initialize meter
            this.meter = metrics.getMeter(
                this.config.serviceName!,
                this.config.serviceVersion!
            );

            // Create common metrics
            this.initializeMetrics();
            
            this.initialized = true;

            if (this.config.debug) {
                StructuredLogger.debug('Telemetry', 'Initialized with config', this.config);
            }
        } catch (error) {
            StructuredLogger.warn('Telemetry', 'Failed to initialize', error);
        }
    }

    /**
     * Initialize common metrics
     */
    private initializeMetrics(): void {
        if (!this.meter) {
            return;
        }

        try {
            // Function execution counter
            this.counters.set('function_calls', 
                this.meter.createCounter('fingerprint_function_calls', {
                    description: 'Number of fingerprint function calls'
                })
            );

            // Error counter
            this.counters.set('errors', 
                this.meter.createCounter('fingerprint_errors', {
                    description: 'Number of errors encountered'
                })
            );

            // Execution time histogram
            this.histograms.set('execution_time', 
                this.meter.createHistogram('fingerprint_execution_time', {
                    description: 'Execution time of fingerprint operations',
                    unit: 'ms'
                })
            );

            // Data collection metrics
            this.counters.set('data_points', 
                this.meter.createCounter('fingerprint_data_points', {
                    description: 'Number of data points collected'
                })
            );

        } catch (error) {
            StructuredLogger.warn('Telemetry', 'Failed to initialize metrics', error);
        }
    }

    /**
     * Check if telemetry should be collected based on sample rate
     */
    private shouldSample(): boolean {
        const rate = this.config.sampleRate ?? 0.1;
        return Math.random() < rate;
    }

    /**
     * Start a new span for operation tracking
     */
    public startSpan(name: string, attributes: Record<string, any> = {}): Span | null {
        if (!this.initialized || !this.tracer || !this.shouldSample()) {
            return null;
        }

        try {
            const span = this.tracer.startSpan(name, {
                kind: SpanKind.INTERNAL,
                attributes: {
                    'service.name': this.config.serviceName,
                    'service.version': this.config.serviceVersion,
                    ...attributes
                }
            });

            return span;
        } catch (error) {
            if (this.config.debug) {
                StructuredLogger.warn('Telemetry', 'Failed to start span', error);
            }
            return null;
        }
    }

    /**
     * End a span with success status
     */
    public endSpan(span: Span | null, attributes: Record<string, any> = {}): void {
        if (!span) return;

        try {
            span.setAttributes(attributes);
            span.setStatus({ code: SpanStatusCode.OK });
            span.end();
        } catch (error) {
            if (this.config.debug) {
                StructuredLogger.warn('Telemetry', 'Failed to end span', error);
            }
        }
    }

    /**
     * End a span with error status
     */
    public endSpanWithError(span: Span | null, error: Error, attributes: Record<string, any> = {}): void {
        if (!span) return;

        try {
            span.setAttributes({
                'error.name': error.name,
                'error.type': error.constructor.name,
                'error.code': (error as any)?.code || 'UNKNOWN',
                ...attributes
            });
            span.setStatus({ 
                code: SpanStatusCode.ERROR, 
                message: `Error: ${error.name}` 
            });
            span.end();
        } catch (err) {
            if (this.config.debug) {
                StructuredLogger.warn('Telemetry', 'Failed to end span with error', err);
            }
        }
    }

    /**
     * Record a metric counter
     */
    public incrementCounter(name: string, value: number = 1, attributes: Record<string, any> = {}): void {
        if (!this.initialized || !this.shouldSample()) {
            return;
        }

        try {
            const counter = this.counters.get(name);
            if (counter) {
                counter.add(value, attributes);
            }
        } catch (error) {
            if (this.config.debug) {
                StructuredLogger.warn('Telemetry', 'Failed to increment counter', error);
            }
        }
    }

    /**
     * Record a histogram value
     */
    public recordHistogram(name: string, value: number, attributes: Record<string, any> = {}): void {
        if (!this.initialized || !this.shouldSample()) {
            return;
        }

        try {
            const histogram = this.histograms.get(name);
            if (histogram) {
                histogram.record(value, attributes);
            }
        } catch (error) {
            if (this.config.debug) {
                StructuredLogger.warn('Telemetry', 'Failed to record histogram', error);
            }
        }
    }

    /**
     * Record an error event
     */
    public recordError(error: Error, context: Record<string, any> = {}): void {
        if (!this.initialized) {
            return;
        }

        try {
            this.incrementCounter('errors', 1, {
                'error.name': error.name,
                'error.type': error.constructor.name,
                'error.code': (error as any)?.code || 'UNKNOWN',
                ...context
            });

            if (this.config.debug) {
                StructuredLogger.debug('Telemetry', `Recorded error: ${error.name}`, context);
            }
        } catch (err) {
            if (this.config.debug) {
                StructuredLogger.warn('Telemetry', 'Failed to record error', err);
            }
        }
    }

    /**
     * Record function execution
     */
    public recordFunctionCall(functionName: string, executionTime: number, success: boolean, context: Record<string, any> = {}): void {
        if (!this.initialized) {
            return;
        }

        try {
            this.incrementCounter('function_calls', 1, {
                'function.name': functionName,
                'function.success': success,
                ...context
            });

            this.recordHistogram('execution_time', executionTime, {
                'function.name': functionName,
                ...context
            });

            if (this.config.debug) {
                StructuredLogger.debug('Telemetry', `Recorded function call: ${functionName} ${executionTime}ms success:${success}`);
            }
        } catch (error) {
            if (this.config.debug) {
                StructuredLogger.warn('Telemetry', 'Failed to record function call', error);
            }
        }
    }

    /**
     * Get current configuration
     */
    public getConfig(): TelemetryConfig {
        return { ...this.config };
    }

    /**
     * Check if telemetry is enabled and initialized
     */
    public isEnabled(): boolean {
        return this.config.enabled === true && this.initialized;
    }
}

// Singleton instance
const telemetryManager = new TelemetryManager();

/**
 * Public API for telemetry
 */
export const Telemetry = {
    /**
     * Initialize telemetry
     */
    initialize: (config: TelemetryConfig = {}) => telemetryManager.initialize(config),

    /**
     * Start a span
     */
    startSpan: (name: string, attributes?: Record<string, any>) => telemetryManager.startSpan(name, attributes),

    /**
     * End a span
     */
    endSpan: (span: Span | null, attributes?: Record<string, any>) => telemetryManager.endSpan(span, attributes),

    /**
     * End a span with error
     */
    endSpanWithError: (span: Span | null, error: Error, attributes?: Record<string, any>) => telemetryManager.endSpanWithError(span, error, attributes),

    /**
     * Record an error
     */
    recordError: (error: Error, context?: Record<string, any>) => telemetryManager.recordError(error, context),

    /**
     * Record function execution
     */
    recordFunctionCall: (functionName: string, executionTime: number, success: boolean, context?: Record<string, any>) => 
        telemetryManager.recordFunctionCall(functionName, executionTime, success, context),

    /**
     * Increment a counter
     */
    incrementCounter: (name: string, value?: number, attributes?: Record<string, any>) => 
        telemetryManager.incrementCounter(name, value, attributes),

    /**
     * Record histogram value
     */
    recordHistogram: (name: string, value: number, attributes?: Record<string, any>) => 
        telemetryManager.recordHistogram(name, value, attributes),

    /**
     * Check if enabled
     */
    isEnabled: () => telemetryManager.isEnabled(),

    /**
     * Get configuration
     */
    getConfig: () => telemetryManager.getConfig()
};

/**
 * Decorator for automatic function telemetry
 */
export function withTelemetry<T extends (...args: any[]) => any>(
    functionName: string,
    originalFunction: T
): T {
    return (function (this: any, ...args: any[]) {
        const startTime = Date.now();
        const span = Telemetry.startSpan(`function.${functionName}`, {
            'function.name': functionName,
            'function.args.count': args.length
        });

        try {
            const result = originalFunction.apply(this, args);

            // Handle both sync and async functions
            if (result && typeof result.then === 'function') {
                return result
                    .then((value: any) => {
                        const executionTime = Date.now() - startTime;
                        Telemetry.recordFunctionCall(functionName, executionTime, true);
                        Telemetry.endSpan(span, { 'function.result': 'success' });
                        return value;
                    })
                    .catch((error: Error) => {
                        const executionTime = Date.now() - startTime;
                        Telemetry.recordFunctionCall(functionName, executionTime, false);
                        Telemetry.recordError(error, { 'function.name': functionName });
                        Telemetry.endSpanWithError(span, error);
                        throw error;
                    });
            } else {
                const executionTime = Date.now() - startTime;
                Telemetry.recordFunctionCall(functionName, executionTime, true);
                Telemetry.endSpan(span, { 'function.result': 'success' });
                return result;
            }
        } catch (error) {
            const executionTime = Date.now() - startTime;
            Telemetry.recordFunctionCall(functionName, executionTime, false);
            Telemetry.recordError(error as Error, { 'function.name': functionName });
            Telemetry.endSpanWithError(span, error as Error);
            throw error;
        }
    }) as T;
}

export default Telemetry;
