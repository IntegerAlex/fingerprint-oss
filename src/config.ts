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
        transparency: false
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
        ...defaultConfig,
        ...customConfig
    };
    
    return currentConfig;
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
