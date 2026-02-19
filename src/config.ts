/*!
 * Configuration System for Fingerprint OSS
 * Copyright (c) 2025 Akshat Kotpalliwar (alias IntegerAlex on GitHub)
 * Licensed under LGPL-3.0
 */

/**
 * Environment types supported by the configuration system
 */
export type Environment = 'TEST' | 'DEV' | 'STAGING' | 'PROD';

/**
 * Log levels for structured logging
 */
export type LogLevel = 'error' | 'warn' | 'info' | 'verbose' | 'debug';

/**
 * Configuration interface for environment-aware settings
 */
export interface FingerprintConfig {
    /** Current environment */
    environment: Environment;
    /** Enable verbose logging for testing */
    verbose: boolean;
    /** Enable transparency mode for GDPR compliance */
    transparency: boolean;
    /** Custom message for data collection transparency */
    message?: string;
    /** Log level for structured logging */
    logLevel: LogLevel;
    /** Enable console output */
    enableConsoleLogging: boolean;
    /** Enable performance metrics logging */
    enablePerformanceLogging: boolean;
    /** Geolocation timeout in milliseconds */
    geoTimeout?: number;
    /** Runtime preset profile */
    preset?: 'default' | 'minimal';
    /** Skip heavy collectors for minimal compute */
    skipCanvasFingerprint?: boolean;
    skipAudioFingerprint?: boolean;
    skipWebGLFingerprint?: boolean;
    reduceFontDetection?: boolean;
    skipGeolocation?: boolean;
}

/**
 * User-facing config accepted by userInfo().
 */
export interface UserInfoConfigInput {
    transparency?: boolean;
    message?: string;
    environment?: Environment;
    verbose?: boolean;
    logLevel?: LogLevel;
    enableConsoleLogging?: boolean;
    enablePerformanceLogging?: boolean;
    geoTimeout?: number;
    preset?: 'default' | 'minimal';
    strictConfig?: boolean;
    telemetry?: {
        enabled?: boolean;
        serviceName?: string;
        serviceVersion?: string;
        endpoint?: string;
        sampleRate?: number;
        debug?: boolean;
    };
}

export interface UserInfoValidationResult {
    normalizedConfig: UserInfoConfigInput;
    warnings: string[];
    errors: string[];
}

/**
 * Default configuration based on environment
 */
const DEFAULT_CONFIGS: Record<Environment, Partial<FingerprintConfig>> = {
    TEST: {
        verbose: true,
        logLevel: 'debug',
        enableConsoleLogging: true,
        enablePerformanceLogging: true,
        transparency: true
    },
    DEV: {
        verbose: true,
        logLevel: 'verbose',
        enableConsoleLogging: true,
        enablePerformanceLogging: true,
        transparency: true
    },
    STAGING: {
        verbose: false,
        logLevel: 'info',
        enableConsoleLogging: true,
        enablePerformanceLogging: false,
        transparency: true
    },
    PROD: {
        verbose: false,
        logLevel: 'error',
        enableConsoleLogging: false,
        enablePerformanceLogging: false,
        transparency: false,
        geoTimeout: 6000,
        preset: 'default'
    }
};

/**
 * Global configuration instance
 */
let currentConfig: FingerprintConfig;

/**
 * Detects the current environment based on various indicators
 */
export function detectEnvironment(): Environment {
    // Check environment variables (Node.js environments)
    if (typeof process !== 'undefined' && process.env) {
        const nodeEnv = process.env.NODE_ENV?.toUpperCase();
        const env = process.env.FINGERPRINT_ENV?.toUpperCase();
        
        if (env === 'TEST' || env === 'DEV' || env === 'STAGING' || env === 'PROD') {
            return env as Environment;
        }
        
        if (nodeEnv === 'TEST') return 'TEST';
        if (nodeEnv === 'DEVELOPMENT') return 'DEV';
        if (nodeEnv === 'STAGING') return 'STAGING';
        if (nodeEnv === 'PRODUCTION') return 'PROD';
    }
    
    // Check browser environment indicators
    if (typeof window !== 'undefined') {
        // Check for development indicators
        if (window.location.hostname === 'localhost' || 
            window.location.hostname === '127.0.0.1' ||
            window.location.hostname.includes('dev') ||
            window.location.port === '3000' ||
            window.location.port === '8080') {
            return 'DEV';
        }
        
        // Check for staging indicators
        if (window.location.hostname.includes('staging') ||
            window.location.hostname.includes('test')) {
            return 'STAGING';
        }
        
        // Check for test indicators
        if (window.location.search.includes('test=true') ||
            window.location.hash.includes('test')) {
            return 'TEST';
        }
    }
    
    // Default to production for safety
    return 'PROD';
}

/**
 * Initializes the configuration system with environment detection
 */
export function initializeConfig(customConfig?: Partial<FingerprintConfig>): FingerprintConfig {
    const detectedEnv = detectEnvironment();
    const defaultConfig = DEFAULT_CONFIGS[detectedEnv];
    
    currentConfig = {
        environment: detectedEnv,
        verbose: false,
        transparency: false,
        logLevel: 'error',
        enableConsoleLogging: false,
        enablePerformanceLogging: false,
        geoTimeout: 6000,
        preset: 'default',
        skipCanvasFingerprint: false,
        skipAudioFingerprint: false,
        skipWebGLFingerprint: false,
        reduceFontDetection: false,
        skipGeolocation: false,
        ...defaultConfig,
        ...customConfig
    };
    
    return currentConfig;
}

/**
 * Applies the minimal preset flags used to reduce client compute.
 */
export function applyPresetMinimal(config: UserInfoConfigInput): UserInfoConfigInput {
    return {
        ...config,
        preset: 'minimal',
        geoTimeout: Math.min(typeof config.geoTimeout === 'number' ? config.geoTimeout : 3000, 3000)
    };
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
    if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) return fallback;
    return Math.min(max, Math.max(min, value));
}

/**
 * Lightweight validator for userInfo configuration.
 *
 * This normalizes primitives, clamps numeric ranges, and reports warnings/errors
 * without adding expensive runtime work.
 */
export function validateUserInfoConfig(config: UserInfoConfigInput = {}): UserInfoValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];
    const strictConfig = config.strictConfig === true;

    const allowedKeys = new Set([
        'transparency',
        'message',
        'environment',
        'verbose',
        'logLevel',
        'enableConsoleLogging',
        'enablePerformanceLogging',
        'geoTimeout',
        'preset',
        'strictConfig',
        'telemetry'
    ]);

    for (const key of Object.keys(config)) {
        if (!allowedKeys.has(key)) {
            const message = `Unknown config key "${key}"`;
            if (strictConfig) {
                errors.push(message);
            } else {
                warnings.push(message);
            }
        }
    }

    const normalized: UserInfoConfigInput = {
        transparency: typeof config.transparency === 'boolean' ? config.transparency : undefined,
        message: typeof config.message === 'string' ? config.message : undefined,
        environment:
            config.environment === 'TEST' || config.environment === 'DEV' || config.environment === 'STAGING' || config.environment === 'PROD'
                ? config.environment
                : undefined,
        verbose: typeof config.verbose === 'boolean' ? config.verbose : undefined,
        logLevel:
            config.logLevel === 'error' || config.logLevel === 'warn' || config.logLevel === 'info' || config.logLevel === 'verbose' || config.logLevel === 'debug'
                ? config.logLevel
                : undefined,
        enableConsoleLogging: typeof config.enableConsoleLogging === 'boolean' ? config.enableConsoleLogging : undefined,
        enablePerformanceLogging: typeof config.enablePerformanceLogging === 'boolean' ? config.enablePerformanceLogging : undefined,
        geoTimeout: clampNumber(config.geoTimeout, 1000, 20000, 6000),
        preset: config.preset === 'minimal' ? 'minimal' : 'default',
        strictConfig
    };

    if (config.message != null && typeof config.message !== 'string') {
        warnings.push('Invalid "message" type; expected string');
    }
    if (config.environment != null && normalized.environment == null) {
        warnings.push('Invalid "environment"; expected TEST|DEV|STAGING|PROD');
    }
    if (config.logLevel != null && normalized.logLevel == null) {
        warnings.push('Invalid "logLevel"; expected error|warn|info|verbose|debug');
    }
    if (typeof config.geoTimeout === 'number' && config.geoTimeout !== normalized.geoTimeout) {
        warnings.push(`"geoTimeout" clamped to ${normalized.geoTimeout}ms`);
    }

    if (config.telemetry && typeof config.telemetry === 'object') {
        const telemetry = { ...config.telemetry } as NonNullable<UserInfoConfigInput['telemetry']>;
        if (telemetry.sampleRate != null) {
            telemetry.sampleRate = clampNumber(telemetry.sampleRate, 0, 1, 0.1);
        }
        normalized.telemetry = telemetry;
    } else if (config.telemetry != null) {
        warnings.push('Invalid "telemetry" type; expected object');
    }

    if (normalized.preset === 'minimal') {
        Object.assign(normalized, applyPresetMinimal(normalized));
    }

    return { normalizedConfig: normalized, warnings, errors };
}

/**
 * Gets the current configuration, initializing if necessary
 */
export function getConfig(): FingerprintConfig {
    if (!currentConfig) {
        return initializeConfig();
    }
    return currentConfig;
}

/**
 * Updates the current configuration
 */
export function updateConfig(updates: Partial<FingerprintConfig>): FingerprintConfig {
    currentConfig = { ...getConfig(), ...updates };
    return currentConfig;
}

/**
 * Checks if verbose logging is enabled for the current environment
 */
export function isVerboseEnabled(): boolean {
    const config = getConfig();
    return config.verbose || config.environment === 'TEST' || config.environment === 'DEV';
}

/**
 * Checks if a log level should be output based on current configuration
 */
export function shouldLog(level: LogLevel): boolean {
    const config = getConfig();
    if (!config.enableConsoleLogging) return false;
    
    const levels: LogLevel[] = ['error', 'warn', 'info', 'verbose', 'debug'];
    const currentLevelIndex = levels.indexOf(config.logLevel);
    const requestedLevelIndex = levels.indexOf(level);
    
    return requestedLevelIndex <= currentLevelIndex;
}

/**
 * Structured logger with environment-aware controls
 */
export class StructuredLogger {
    private static formatMessage(level: LogLevel, operation: string, message: string, data?: any): string {
        const config = getConfig();
        const timestamp = new Date().toISOString();
        const env = config.environment;
        
        let formattedMessage = `[${timestamp}] [${env}] [${level.toUpperCase()}] [${operation}] ${message}`;
        
        if (data && config.verbose) {
            formattedMessage += `\nData: ${JSON.stringify(data, null, 2)}`;
        }
        
        return formattedMessage;
    }
    
    static error(operation: string, message: string, data?: any): void {
        if (shouldLog('error')) {
            console.error(this.formatMessage('error', operation, message, data));
        }
    }
    
    static warn(operation: string, message: string, data?: any): void {
        if (shouldLog('warn')) {
            console.warn(this.formatMessage('warn', operation, message, data));
        }
    }
    
    static info(operation: string, message: string, data?: any): void {
        if (shouldLog('info')) {
            console.info(this.formatMessage('info', operation, message, data));
        }
    }
    
    static verbose(operation: string, message: string, data?: any): void {
        if (shouldLog('verbose')) {
            console.log(this.formatMessage('verbose', operation, message, data));
        }
    }
    
    static debug(operation: string, message: string, data?: any): void {
        if (shouldLog('debug')) {
            console.log(this.formatMessage('debug', operation, message, data));
        }
    }
    
    /**
     * Logs a block operation with timing information
     */
    static logBlock<T>(operation: string, description: string, block: () => T | Promise<T>): T | Promise<T> {
        const config = getConfig();
        const startTime = performance.now();
        
        if (config.verbose) {
            this.verbose(operation, `Starting: ${description}`);
        }
        
        try {
            const result = block();
            
            if (result instanceof Promise) {
                return result.then((res) => {
                    const endTime = performance.now();
                    if (config.verbose || config.enablePerformanceLogging) {
                        this.verbose(operation, `Completed: ${description} (${(endTime - startTime).toFixed(2)}ms)`);
                    }
                    return res;
                }).catch((error) => {
                    const endTime = performance.now();
                    this.error(operation, `Failed: ${description} (${(endTime - startTime).toFixed(2)}ms)`, error);
                    throw error;
                });
            } else {
                const endTime = performance.now();
                if (config.verbose || config.enablePerformanceLogging) {
                    this.verbose(operation, `Completed: ${description} (${(endTime - startTime).toFixed(2)}ms)`);
                }
                return result;
            }
        } catch (error) {
            const endTime = performance.now();
            this.error(operation, `Failed: ${description} (${(endTime - startTime).toFixed(2)}ms)`, error);
            throw error;
        }
    }
}

/**
 * Performance timing utility for development environments
 */
export class PerformanceTimer {
    private static timers = new Map<string, number>();
    
    static start(label: string): void {
        const config = getConfig();
        if (config.enablePerformanceLogging || config.verbose) {
            this.timers.set(label, performance.now());
            StructuredLogger.debug('PERFORMANCE', `Timer started: ${label}`);
        }
    }
    
    static end(label: string): number {
        const config = getConfig();
        if (config.enablePerformanceLogging || config.verbose) {
            const startTime = this.timers.get(label);
            if (startTime) {
                const duration = performance.now() - startTime;
                this.timers.delete(label);
                StructuredLogger.debug('PERFORMANCE', `Timer ended: ${label} (${duration.toFixed(2)}ms)`);
                return duration;
            }
        }
        return 0;
    }
}

// Initialize configuration on module load
initializeConfig();
