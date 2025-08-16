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
 * Tests for debug logging system
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  DebugLogger, 
  DebugLogLevel, 
  NormalizationStepType,
  getDebugLogger,
  startDebugSession,
  endDebugSession
} from './debug';

describe('DebugLogger', () => {
  let logger: DebugLogger;

  beforeEach(() => {
    logger = new DebugLogger({
      enabled: true,
      logLevel: DebugLogLevel.DEBUG
    });
  });

  it('should start and end debug sessions', () => {
    const sessionId = logger.startSession();
    expect(sessionId).toBeDefined();
    expect(sessionId).toMatch(/^debug_\d+_[a-z0-9]+$/);

    const session = logger.endSession();
    expect(session).toBeDefined();
    expect(session?.sessionId).toBe(sessionId);
    expect(session?.endTime).toBeDefined();
    expect(session?.summary.processingTimeMs).toBeGreaterThan(0);
  });

  it('should log normalization steps', () => {
    const sessionId = logger.startSession();
    
    logger.logNormalizationStep(
      NormalizationStepType.NUMERIC_ROUND,
      'testProperty',
      3.14159,
      '3.142',
      { precision: 3 }
    );

    const session = logger.endSession();
    expect(session?.normalizationSteps).toHaveLength(1);
    
    const step = session?.normalizationSteps[0];
    expect(step?.type).toBe(NormalizationStepType.NUMERIC_ROUND);
    expect(step?.property).toBe('testProperty');
    expect(step?.beforeValue).toBe(3.14159);
    expect(step?.afterValue).toBe('3.142');
    expect(step?.metadata?.precision).toBe(3);
  });

  it('should log fallback applications', () => {
    const sessionId = logger.startSession();
    
    logger.logFallback(
      'userAgent',
      'missing_property',
      null,
      'ua_unavailable_v2'
    );

    const session = logger.endSession();
    expect(session?.summary.fallbacksApplied).toBe(1);
    expect(session?.logEntries.some(entry => 
      entry.category === 'fallback' && entry.message.includes('userAgent')
    )).toBe(true);
  });

  it('should log validation issues', () => {
    const sessionId = logger.startSession();
    
    logger.logValidation(
      'screenResolution',
      'invalid_format',
      'not_an_array',
      [0, 0]
    );

    const session = logger.endSession();
    expect(session?.summary.validationErrors).toBe(1);
    expect(session?.logEntries.some(entry => 
      entry.category === 'validation' && entry.message.includes('screenResolution')
    )).toBe(true);
  });

  it('should respect log level filtering', () => {
    const restrictiveLogger = new DebugLogger({
      enabled: true,
      logLevel: DebugLogLevel.WARN
    });

    const sessionId = restrictiveLogger.startSession();
    
    // This should not be logged (DEBUG < WARN)
    restrictiveLogger.log(DebugLogLevel.DEBUG, 'test', 'debug message');
    
    // This should be logged (WARN >= WARN)
    restrictiveLogger.log(DebugLogLevel.WARN, 'test', 'warning message');

    const session = restrictiveLogger.endSession();
    const debugMessages = session?.logEntries.filter(entry => entry.level === DebugLogLevel.DEBUG);
    const warnMessages = session?.logEntries.filter(entry => entry.level === DebugLogLevel.WARN);
    
    expect(debugMessages?.length).toBe(0);
    expect(warnMessages?.length).toBeGreaterThan(0);
  });

  it('should generate summary reports', () => {
    const sessionId = logger.startSession();
    
    logger.logNormalizationStep(NormalizationStepType.STRING_NORMALIZE, 'prop1', 'old', 'new');
    logger.logNormalizationStep(NormalizationStepType.ARRAY_SORT, 'prop2', [3, 1, 2], [1, 2, 3]);
    logger.logFallback('prop3', 'missing', null, 'fallback');

    const session = logger.endSession();
    const report = logger.createSummaryReport(session);
    
    expect(report).toContain('Total Steps: 2');
    expect(report).toContain('Fallbacks Applied: 1');
    expect(report).toContain('string_normalize: 1');
    expect(report).toContain('array_sort: 1');
  });

  it('should export sessions as JSON', () => {
    const sessionId = logger.startSession();
    logger.log(DebugLogLevel.INFO, 'test', 'test message');
    const session = logger.endSession();
    
    const exported = logger.exportSession(session);
    const parsed = JSON.parse(exported);
    
    expect(parsed.sessionId).toBe(sessionId);
    expect(parsed.logEntries).toHaveLength(2); // start + test message
    expect(parsed.summary).toBeDefined();
  });
});

describe('Global debug logger', () => {
  it('should provide global logger instance', () => {
    const logger1 = getDebugLogger();
    const logger2 = getDebugLogger();
    
    expect(logger1).toBe(logger2); // Same instance
  });

  it('should support convenience functions', () => {
    const sessionId = startDebugSession({ enabled: true });
    expect(sessionId).toBeDefined();
    
    const session = endDebugSession();
    expect(session?.sessionId).toBe(sessionId);
  });
});

describe('Debug integration with normalization', () => {
  it('should track normalization steps when property name is provided', async () => {
    const { reliableRound, normalizeStringValue } = await import('./normalization');
    
    const sessionId = startDebugSession({ enabled: true });
    
    // These should create debug entries
    const rounded = reliableRound(3.14159, 3, 'testNumber');
    const normalized = normalizeStringValue('  test string  ', 'testString');
    
    const session = endDebugSession();
    
    expect(session?.normalizationSteps.length).toBeGreaterThan(0);
    expect(session?.normalizationSteps.some(step => 
      step.property === 'testNumber' && step.type === NormalizationStepType.NUMERIC_ROUND
    )).toBe(true);
    expect(session?.normalizationSteps.some(step => 
      step.property === 'testString' && step.type === NormalizationStepType.STRING_NORMALIZE
    )).toBe(true);
  });
});