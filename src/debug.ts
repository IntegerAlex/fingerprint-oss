/*!
 * Copyright (c) 2025 Akshat Kotpalliwar (alias IntegerAlex on GitHub)
 * This software is licensed under the GNU Lesser General Public License (LGPL) v3 or later.
 *
 * You are free to use, modify, and redistribute this software, but modifications must also be licensed under the LGPL.
 * This project is distributed without any warranty; see the LGPL for more details.
 *
 * For a full copy of the LGPL and ethical contribution guidelines, please refer to the `COPYRIGHT.md` and `NOTICE.md` files.
 */

/**
 * Debug logging system for fingerprint hash generation.
 * Provides detailed logging of normalization steps, input modifications, and processing flow.
 */

/**
 * Log levels for debug output
 */
export enum DebugLogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4
}

/**
 * Types of normalization steps that can be logged
 */
export enum NormalizationStepType {
  NUMERIC_ROUND = 'numeric_round',
  STRING_NORMALIZE = 'string_normalize',
  ARRAY_SORT = 'array_sort',
  OBJECT_KEY_SORT = 'object_key_sort',
  FALLBACK_APPLIED = 'fallback_applied',
  VALIDATION_SANITIZE = 'validation_sanitize',
  SERIALIZATION = 'serialization'
}

/**
 * Represents a single normalization step with before/after values
 */
export interface NormalizationStep {
  stepId: string;
  type: NormalizationStepType;
  property: string;
  beforeValue: any;
  afterValue: any;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * Configuration for debug logging behavior
 */
export interface DebugConfig {
  enabled: boolean;
  logLevel: DebugLogLevel;
  logNormalizationSteps: boolean;
  logFallbacks: boolean;
  logValidation: boolean;
  logSerialization: boolean;
  maxLogEntries: number;
  includeTimestamps: boolean;
  includeStackTrace: boolean;
}

/**
 * Debug log entry structure
 */
export interface DebugLogEntry {
  id: string;
  timestamp: number;
  level: DebugLogLevel;
  category: string;
  message: string;
  data?: any;
  stackTrace?: string;
}

/**
 * Complete debug session information
 */
export interface DebugSession {
  sessionId: string;
  startTime: number;
  endTime?: number;
  config: DebugConfig;
  logEntries: DebugLogEntry[];
  normalizationSteps: NormalizationStep[];
  summary: DebugSummary;
}

/**
 * Summary of debug session statistics
 */
export interface DebugSummary {
  totalSteps: number;
  stepsByType: Record<NormalizationStepType, number>;
  fallbacksApplied: number;
  validationErrors: number;
  processingTimeMs: number;
  memoryUsage?: {
    heapUsed: number;
    heapTotal: number;
  };
}

/**
 * Default debug configuration
 */
export const DEFAULT_DEBUG_CONFIG: DebugConfig = {
  enabled: false,
  logLevel: DebugLogLevel.DEBUG,
  logNormalizationSteps: true,
  logFallbacks: true,
  logValidation: true,
  logSerialization: true,
  maxLogEntries: 1000,
  includeTimestamps: true,
  includeStackTrace: false
};

/**
 * Debug logger class for fingerprint hash generation
 */
export class DebugLogger {
  private config: DebugConfig;
  private currentSession: DebugSession | null = null;
  private stepCounter = 0;
  private logCounter = 0;

  constructor(config: Partial<DebugConfig> = {}) {
    this.config = { ...DEFAULT_DEBUG_CONFIG, ...config };
  }

  /**
   * Starts a new debug session
   */
  startSession(sessionId?: string): string {
    const id = sessionId || this.generateSessionId();
    
    this.currentSession = {
      sessionId: id,
      startTime: performance.now(),
      config: { ...this.config },
      logEntries: [],
      normalizationSteps: [],
      summary: {
        totalSteps: 0,
        stepsByType: {} as Record<NormalizationStepType, number>,
        fallbacksApplied: 0,
        validationErrors: 0,
        processingTimeMs: 0
      }
    };

    this.stepCounter = 0;
    this.logCounter = 0;

    this.log(DebugLogLevel.INFO, 'session', `Debug session started: ${id}`);
    return id;
  }

  /**
   * Ends the current debug session
   */
  endSession(): DebugSession | null {
    if (!this.currentSession) {
      return null;
    }

    this.currentSession.endTime = performance.now();
    this.currentSession.summary.processingTimeMs = 
      this.currentSession.endTime - this.currentSession.startTime;

    // Add memory usage if available
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const memory = (performance as any).memory;
      this.currentSession.summary.memoryUsage = {
        heapUsed: memory.usedJSHeapSize,
        heapTotal: memory.totalJSHeapSize
      };
    }

    this.log(DebugLogLevel.INFO, 'session', 
      `Debug session ended. Duration: ${this.currentSession.summary.processingTimeMs.toFixed(2)}ms`);

    const session = this.currentSession;
    this.currentSession = null;
    return session;
  }

  /**
   * Logs a normalization step with before/after values
   */
  logNormalizationStep(
    type: NormalizationStepType,
    property: string,
    beforeValue: any,
    afterValue: any,
    metadata?: Record<string, any>
  ): void {
    if (!this.config.enabled || !this.config.logNormalizationSteps || !this.currentSession) {
      return;
    }

    const stepId = `step_${++this.stepCounter}`;
    const step: NormalizationStep = {
      stepId,
      type,
      property,
      beforeValue: this.cloneValue(beforeValue),
      afterValue: this.cloneValue(afterValue),
      timestamp: performance.now(),
      metadata: metadata ? { ...metadata } : undefined
    };

    this.currentSession.normalizationSteps.push(step);
    this.currentSession.summary.totalSteps++;
    
    // Update step type counters
    if (!this.currentSession.summary.stepsByType[type]) {
      this.currentSession.summary.stepsByType[type] = 0;
    }
    this.currentSession.summary.stepsByType[type]++;

    // Log the step if debug level is appropriate
    if (this.config.logLevel <= DebugLogLevel.DEBUG) {
      const changed = !this.valuesEqual(beforeValue, afterValue);
      const changeIndicator = changed ? ' [CHANGED]' : ' [UNCHANGED]';
      
      this.log(
        DebugLogLevel.DEBUG,
        'normalization',
        `${type}: ${property}${changeIndicator}`,
        {
          stepId,
          beforeValue: this.truncateForLog(beforeValue),
          afterValue: this.truncateForLog(afterValue),
          metadata
        }
      );
    }
  }

  /**
   * Logs a fallback application
   */
  logFallback(
    property: string,
    reason: string,
    originalValue: any,
    fallbackValue: any
  ): void {
    if (!this.config.enabled || !this.config.logFallbacks || !this.currentSession) {
      return;
    }

    this.currentSession.summary.fallbacksApplied++;

    this.logNormalizationStep(
      NormalizationStepType.FALLBACK_APPLIED,
      property,
      originalValue,
      fallbackValue,
      { reason }
    );

    this.log(
      DebugLogLevel.WARN,
      'fallback',
      `Fallback applied for ${property}: ${reason}`,
      {
        originalValue: this.truncateForLog(originalValue),
        fallbackValue: this.truncateForLog(fallbackValue)
      }
    );
  }

  /**
   * Logs a validation error or sanitization
   */
  logValidation(
    property: string,
    issue: string,
    originalValue: any,
    sanitizedValue?: any
  ): void {
    if (!this.config.enabled || !this.config.logValidation || !this.currentSession) {
      return;
    }

    this.currentSession.summary.validationErrors++;

    if (sanitizedValue !== undefined) {
      this.logNormalizationStep(
        NormalizationStepType.VALIDATION_SANITIZE,
        property,
        originalValue,
        sanitizedValue,
        { issue }
      );
    }

    this.log(
      DebugLogLevel.WARN,
      'validation',
      `Validation issue for ${property}: ${issue}`,
      {
        originalValue: this.truncateForLog(originalValue),
        sanitizedValue: sanitizedValue !== undefined ? this.truncateForLog(sanitizedValue) : undefined
      }
    );
  }

  /**
   * Logs serialization information
   */
  logSerialization(
    inputSize: number,
    outputSize: number,
    compressionRatio?: number
  ): void {
    if (!this.config.enabled || !this.config.logSerialization || !this.currentSession) {
      return;
    }

    this.log(
      DebugLogLevel.DEBUG,
      'serialization',
      `Serialization complete. Input: ${inputSize} chars, Output: ${outputSize} chars`,
      {
        inputSize,
        outputSize,
        compressionRatio: compressionRatio || (outputSize / inputSize)
      }
    );
  }

  /**
   * Logs a general message
   */
  log(level: DebugLogLevel, category: string, message: string, data?: any): void {
    if (!this.config.enabled || level < this.config.logLevel || !this.currentSession) {
      return;
    }

    // Prevent log overflow
    if (this.currentSession.logEntries.length >= this.config.maxLogEntries) {
      return;
    }

    const entry: DebugLogEntry = {
      id: `log_${++this.logCounter}`,
      timestamp: performance.now(),
      level,
      category,
      message,
      data: data ? this.cloneValue(data) : undefined
    };

    if (this.config.includeStackTrace && level >= DebugLogLevel.WARN) {
      entry.stackTrace = new Error().stack;
    }

    this.currentSession.logEntries.push(entry);

    // Also output to console if appropriate
    this.outputToConsole(entry);
  }

  /**
   * Gets the current debug session
   */
  getCurrentSession(): DebugSession | null {
    return this.currentSession ? { ...this.currentSession } : null;
  }

  /**
   * Updates the debug configuration
   */
  updateConfig(config: Partial<DebugConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (this.currentSession) {
      this.currentSession.config = { ...this.config };
    }
  }

  /**
   * Exports debug session as JSON
   */
  exportSession(session?: DebugSession): string {
    const sessionToExport = session || this.currentSession;
    if (!sessionToExport) {
      throw new Error('No debug session available to export');
    }

    return JSON.stringify(sessionToExport, null, 2);
  }

  /**
   * Creates a summary report of the debug session
   */
  createSummaryReport(session?: DebugSession): string {
    const sessionToReport = session || this.currentSession;
    if (!sessionToReport) {
      return 'No debug session available';
    }

    const { summary, logEntries, normalizationSteps } = sessionToReport;
    const lines: string[] = [];

    lines.push('=== Debug Session Summary ===');
    lines.push(`Session ID: ${sessionToReport.sessionId}`);
    lines.push(`Duration: ${summary.processingTimeMs.toFixed(2)}ms`);
    lines.push(`Total Steps: ${summary.totalSteps}`);
    lines.push(`Fallbacks Applied: ${summary.fallbacksApplied}`);
    lines.push(`Validation Errors: ${summary.validationErrors}`);
    lines.push(`Log Entries: ${logEntries.length}`);

    if (summary.memoryUsage) {
      lines.push(`Memory Used: ${(summary.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    }

    lines.push('\n=== Steps by Type ===');
    Object.entries(summary.stepsByType).forEach(([type, count]) => {
      lines.push(`${type}: ${count}`);
    });

    lines.push('\n=== Recent Log Entries ===');
    logEntries.slice(-10).forEach(entry => {
      const levelName = DebugLogLevel[entry.level];
      lines.push(`[${levelName}] ${entry.category}: ${entry.message}`);
    });

    return lines.join('\n');
  }

  // Private helper methods

  private generateSessionId(): string {
    return `debug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private cloneValue(value: any): any {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch {
      return String(value);
    }
  }

  private valuesEqual(a: any, b: any): boolean {
    try {
      return JSON.stringify(a) === JSON.stringify(b);
    } catch {
      return a === b;
    }
  }

  private truncateForLog(value: any, maxLength: number = 200): any {
    if (typeof value === 'string' && value.length > maxLength) {
      return value.substring(0, maxLength) + '...';
    }
    
    if (typeof value === 'object' && value !== null) {
      const str = JSON.stringify(value);
      if (str.length > maxLength) {
        return str.substring(0, maxLength) + '...';
      }
    }
    
    return value;
  }

  private outputToConsole(entry: DebugLogEntry): void {
    if (typeof console === 'undefined') {
      return;
    }

    const timestamp = this.config.includeTimestamps 
      ? `[${new Date(entry.timestamp).toISOString()}] ` 
      : '';
    
    const message = `${timestamp}[${entry.category.toUpperCase()}] ${entry.message}`;

    switch (entry.level) {
      case DebugLogLevel.TRACE:
      case DebugLogLevel.DEBUG:
        console.debug(message, entry.data);
        break;
      case DebugLogLevel.INFO:
        console.info(message, entry.data);
        break;
      case DebugLogLevel.WARN:
        console.warn(message, entry.data);
        break;
      case DebugLogLevel.ERROR:
        console.error(message, entry.data);
        break;
    }
  }
}

/**
 * Global debug logger instance
 */
let globalDebugLogger: DebugLogger | null = null;

/**
 * Gets or creates the global debug logger instance
 */
export function getDebugLogger(config?: Partial<DebugConfig>): DebugLogger {
  if (!globalDebugLogger) {
    globalDebugLogger = new DebugLogger(config);
  } else if (config) {
    globalDebugLogger.updateConfig(config);
  }
  
  return globalDebugLogger;
}

/**
 * Convenience function to start a debug session
 */
export function startDebugSession(config?: Partial<DebugConfig>): string {
  const logger = getDebugLogger(config);
  return logger.startSession();
}

/**
 * Convenience function to end a debug session
 */
export function endDebugSession(): DebugSession | null {
  if (!globalDebugLogger) {
    return null;
  }
  
  return globalDebugLogger.endSession();
}