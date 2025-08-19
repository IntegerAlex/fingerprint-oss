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
 * Security validation and entropy preservation utilities for fingerprint hash generation.
 * Ensures that normalization preserves uniqueness and resists manipulation attempts.
 */

import { SystemInfo } from './types';
import { normalizeValue } from './normalization';

/**
 * Enum defining different types of security threats
 */
export enum SecurityThreatType {
  ENTROPY_LOSS = 'entropy_loss',
  MANIPULATION_ATTEMPT = 'manipulation_attempt',
  SPOOFING_ATTEMPT = 'spoofing_attempt',
  COLLISION_RISK = 'collision_risk',
  FINGERPRINT_EVASION = 'fingerprint_evasion'
}

/**
 * Interface representing a security validation result
 */
export interface SecurityValidationResult {
  isSecure: boolean;
  threats: SecurityThreat[];
  entropyScore: number;
  manipulationResistanceScore: number;
  recommendations: string[];
}

/**
 * Interface representing a detected security threat
 */
export interface SecurityThreat {
  type: SecurityThreatType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  property: string;
  description: string;
  originalValue: any;
  normalizedValue: any;
  riskScore: number;
}

/**
 * Configuration for security validation
 */
export interface SecurityValidationConfig {
  minEntropyThreshold: number;
  maxCollisionRisk: number;
  enableManipulationDetection: boolean;
  enableSpoofingDetection: boolean;
  strictMode: boolean;
}

/**
 * Default security validation configuration
 */
export const DEFAULT_SECURITY_CONFIG: SecurityValidationConfig = {
  minEntropyThreshold: 0.7,
  maxCollisionRisk: 0.1,
  enableManipulationDetection: true,
  enableSpoofingDetection: true,
  strictMode: false
};

/**
 * Result of entropy analysis
 */
export interface EntropyAnalysisResult {
  originalEntropy: number;
  normalizedEntropy: number;
  entropyPreservationRatio: number;
  uniquenessScore: number;
  distributionAnalysis: DistributionAnalysis;
}

/**
 * Analysis of data distribution for entropy calculation
 */
export interface DistributionAnalysis {
  uniqueValues: number;
  totalValues: number;
  mostCommonValue: any;
  mostCommonValueFrequency: number;
  uniformityScore: number;
}

/**
 * Security validator class for fingerprint hash generation
 */
export class SecurityValidator {
  private config: SecurityValidationConfig;

  constructor(config: Partial<SecurityValidationConfig> = {}) {
    this.config = { ...DEFAULT_SECURITY_CONFIG, ...config };
  }

  /**
   * Performs comprehensive security validation on SystemInfo data
   * @param originalInfo - The original SystemInfo object
   * @param normalizedInfo - The normalized SystemInfo object
   * @returns SecurityValidationResult with detailed security analysis
   */
  validateSecurity(originalInfo: SystemInfo, normalizedInfo: any): SecurityValidationResult {
    const threats: SecurityThreat[] = [];
    const recommendations: string[] = [];

    // Perform entropy analysis
    const entropyAnalysis = this.analyzeEntropy(originalInfo, normalizedInfo);
    
    // Check for entropy loss
    if (entropyAnalysis.entropyPreservationRatio < this.config.minEntropyThreshold) {
      threats.push({
        type: SecurityThreatType.ENTROPY_LOSS,
        severity: 'high',
        property: 'global',
        description: `Normalization reduced entropy by ${((1 - entropyAnalysis.entropyPreservationRatio) * 100).toFixed(1)}%`,
        originalValue: entropyAnalysis.originalEntropy,
        normalizedValue: entropyAnalysis.normalizedEntropy,
        riskScore: 1 - entropyAnalysis.entropyPreservationRatio
      });
      recommendations.push('Consider adjusting normalization rules to preserve more entropy');
    }

    // Check for manipulation attempts
    if (this.config.enableManipulationDetection) {
      const manipulationThreats = this.detectManipulationAttempts(originalInfo);
      threats.push(...manipulationThreats);
    }

    // Check for spoofing attempts
    if (this.config.enableSpoofingDetection) {
      const spoofingThreats = this.detectSpoofingAttempts(originalInfo);
      threats.push(...spoofingThreats);
    }

    // Check for collision risks
    const collisionRisk = this.assessCollisionRisk(normalizedInfo);
    if (collisionRisk > this.config.maxCollisionRisk) {
      threats.push({
        type: SecurityThreatType.COLLISION_RISK,
        severity: collisionRisk > 0.5 ? 'critical' : 'high',
        property: 'global',
        description: `High collision risk detected: ${(collisionRisk * 100).toFixed(1)}%`,
        originalValue: null,
        normalizedValue: null,
        riskScore: collisionRisk
      });
      recommendations.push('Increase fingerprint complexity to reduce collision risk');
    }

    // Calculate overall security scores
    const manipulationResistanceScore = this.calculateManipulationResistance(originalInfo, normalizedInfo);
    
    // Determine if the fingerprint is secure
    const criticalThreats = threats.filter(t => t.severity === 'critical');
    const highThreats = threats.filter(t => t.severity === 'high');
    
    let isSecure: boolean;
    if (this.config.strictMode) {
      isSecure = criticalThreats.length === 0 && highThreats.length === 0;
    } else {
      isSecure = criticalThreats.length === 0;
    }

    return {
      isSecure,
      threats,
      entropyScore: entropyAnalysis.entropyPreservationRatio,
      manipulationResistanceScore,
      recommendations
    };
  }

  /**
   * Analyzes entropy preservation during normalization
   * @param originalInfo - The original SystemInfo object
   * @param normalizedInfo - The normalized SystemInfo object
   * @returns EntropyAnalysisResult with detailed entropy analysis
   */
  analyzeEntropy(originalInfo: SystemInfo, normalizedInfo: any): EntropyAnalysisResult {
    const originalEntropy = this.calculateEntropy(originalInfo);
    const normalizedEntropy = this.calculateEntropy(normalizedInfo);
    
    const entropyPreservationRatio = normalizedEntropy / Math.max(originalEntropy, 0.001);
    const uniquenessScore = this.calculateUniquenessScore(normalizedInfo);
    
    const distributionAnalysis = this.analyzeDistribution(normalizedInfo);

    return {
      originalEntropy,
      normalizedEntropy,
      entropyPreservationRatio: Math.min(entropyPreservationRatio, 1.0),
      uniquenessScore,
      distributionAnalysis
    };
  }

  /**
   * Detects potential manipulation attempts in SystemInfo data
   * @param info - The SystemInfo object to analyze
   * @returns Array of detected manipulation threats
   */
  detectManipulationAttempts(info: SystemInfo): SecurityThreat[] {
    const threats: SecurityThreat[] = [];

    // Check for suspicious user agent patterns
    if (this.isSuspiciousUserAgent(info.userAgent)) {
      threats.push({
        type: SecurityThreatType.MANIPULATION_ATTEMPT,
        severity: 'medium',
        property: 'userAgent',
        description: 'Suspicious user agent pattern detected',
        originalValue: info.userAgent,
        normalizedValue: normalizeValue(info.userAgent),
        riskScore: 0.6
      });
    }

    // Enhanced suspicious input pattern detection
    const suspiciousPatterns = this.detectSuspiciousInputPatterns(info);
    threats.push(...suspiciousPatterns);

    // Check for inconsistent hardware specifications
    if (this.hasInconsistentHardware(info)) {
      threats.push({
        type: SecurityThreatType.MANIPULATION_ATTEMPT,
        severity: 'medium',
        property: 'hardware',
        description: 'Inconsistent hardware specifications detected',
        originalValue: {
          hardwareConcurrency: info.hardwareConcurrency,
          deviceMemory: info.deviceMemory,
          screenResolution: info.screenResolution
        },
        normalizedValue: null,
        riskScore: 0.5
      });
    }

    // Check for plugin manipulation
    if (this.hasSuspiciousPlugins(info.plugins)) {
      threats.push({
        type: SecurityThreatType.MANIPULATION_ATTEMPT,
        severity: 'low',
        property: 'plugins',
        description: 'Suspicious plugin configuration detected',
        originalValue: info.plugins,
        normalizedValue: normalizeValue(info.plugins),
        riskScore: 0.3
      });
    }

    // Check for canvas fingerprint evasion
    if (this.hasCanvasEvasion(info.canvas)) {
      threats.push({
        type: SecurityThreatType.FINGERPRINT_EVASION,
        severity: 'medium',
        property: 'canvas',
        description: 'Canvas fingerprint evasion detected',
        originalValue: info.canvas,
        normalizedValue: normalizeValue(info.canvas),
        riskScore: 0.7
      });
    }

    // Check for font manipulation
    const fontThreats = this.detectFontManipulation(info.fontPreferences);
    threats.push(...fontThreats);

    // Check for math constant manipulation
    const mathThreats = this.detectMathConstantManipulation(info.mathConstants);
    threats.push(...mathThreats);

    // Check for language/locale manipulation
    const localeThreats = this.detectLocaleManipulation(info);
    threats.push(...localeThreats);

    return threats;
  }

  /**
   * Detects suspicious input patterns across all SystemInfo properties
   * @param info - The SystemInfo object to analyze
   * @returns Array of detected threats
   */
  private detectSuspiciousInputPatterns(info: SystemInfo): SecurityThreat[] {
    const threats: SecurityThreat[] = [];

    // Check for script injection patterns in string properties
    const scriptInjectionThreats = this.detectScriptInjection(info);
    threats.push(...scriptInjectionThreats);

    // Check for SQL injection patterns
    const sqlInjectionThreats = this.detectSQLInjection(info);
    threats.push(...sqlInjectionThreats);

    // Check for path traversal attempts
    const pathTraversalThreats = this.detectPathTraversal(info);
    threats.push(...pathTraversalThreats);

    // Check for buffer overflow attempts (excessively long strings)
    const bufferOverflowThreats = this.detectBufferOverflow(info);
    threats.push(...bufferOverflowThreats);

    // Check for encoding manipulation
    const encodingThreats = this.detectEncodingManipulation(info);
    threats.push(...encodingThreats);

    return threats;
  }

  /**
   * Detects script injection attempts in string properties
   */
  private detectScriptInjection(info: SystemInfo): SecurityThreat[] {
    const threats: SecurityThreat[] = [];
    const scriptPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /eval\s*\(/gi,
      /Function\s*\(/gi,
      /<iframe|<object|<embed|<link|<meta/gi
    ];

    const stringProperties = [
      { key: 'userAgent', value: info.userAgent },
      { key: 'platform', value: info.platform },
      { key: 'colorGamut', value: info.colorGamut },
      { key: 'timezone', value: info.timezone },
      { key: 'vendor', value: info.vendor }
    ];

    for (const prop of stringProperties) {
      if (typeof prop.value === 'string') {
        for (const pattern of scriptPatterns) {
          if (pattern.test(prop.value)) {
            threats.push({
              type: SecurityThreatType.MANIPULATION_ATTEMPT,
              severity: 'high',
              property: prop.key,
              description: `Script injection pattern detected in ${prop.key}`,
              originalValue: prop.value,
              normalizedValue: normalizeValue(prop.value),
              riskScore: 0.9
            });
            break; // One threat per property is enough
          }
        }
      }
    }

    return threats;
  }

  /**
   * Detects SQL injection attempts in string properties
   */
  private detectSQLInjection(info: SystemInfo): SecurityThreat[] {
    const threats: SecurityThreat[] = [];
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
      /(';|--;|\|\||\/\*|\*\/)/gi,
      /('.*OR.*'|'.*AND.*')/gi,
      /(\bOR\b|\bAND\b).*['"]/gi
    ];

    const stringProperties = [
      { key: 'userAgent', value: info.userAgent },
      { key: 'platform', value: info.platform },
      { key: 'timezone', value: info.timezone },
      { key: 'vendor', value: info.vendor }
    ];

    for (const prop of stringProperties) {
      if (typeof prop.value === 'string') {
        for (const pattern of sqlPatterns) {
          if (pattern.test(prop.value)) {
            threats.push({
              type: SecurityThreatType.MANIPULATION_ATTEMPT,
              severity: 'high',
              property: prop.key,
              description: `SQL injection pattern detected in ${prop.key}`,
              originalValue: prop.value,
              normalizedValue: normalizeValue(prop.value),
              riskScore: 0.8
            });
            break;
          }
        }
      }
    }

    return threats;
  }

  /**
   * Detects path traversal attempts
   */
  private detectPathTraversal(info: SystemInfo): SecurityThreat[] {
    const threats: SecurityThreat[] = [];
    const pathTraversalPatterns = [
      /\.\.\//gi,
      /\.\.\\/gi,
      /%2e%2e%2f/gi,
      /%2e%2e%5c/gi,
      /\.\.%2f/gi,
      /\.\.%5c/gi
    ];

    const stringProperties = [
      { key: 'userAgent', value: info.userAgent },
      { key: 'platform', value: info.platform },
      { key: 'timezone', value: info.timezone }
    ];

    for (const prop of stringProperties) {
      if (typeof prop.value === 'string') {
        for (const pattern of pathTraversalPatterns) {
          if (pattern.test(prop.value)) {
            threats.push({
              type: SecurityThreatType.MANIPULATION_ATTEMPT,
              severity: 'medium',
              property: prop.key,
              description: `Path traversal pattern detected in ${prop.key}`,
              originalValue: prop.value,
              normalizedValue: normalizeValue(prop.value),
              riskScore: 0.7
            });
            break;
          }
        }
      }
    }

    return threats;
  }

  /**
   * Detects buffer overflow attempts (excessively long strings)
   */
  private detectBufferOverflow(info: SystemInfo): SecurityThreat[] {
    const threats: SecurityThreat[] = [];
    const maxLengths = {
      userAgent: 2000,
      platform: 100,
      colorGamut: 50,
      timezone: 100,
      vendor: 200
    };

    const stringProperties = [
      { key: 'userAgent', value: info.userAgent, maxLength: maxLengths.userAgent },
      { key: 'platform', value: info.platform, maxLength: maxLengths.platform },
      { key: 'colorGamut', value: info.colorGamut, maxLength: maxLengths.colorGamut },
      { key: 'timezone', value: info.timezone, maxLength: maxLengths.timezone },
      { key: 'vendor', value: info.vendor, maxLength: maxLengths.vendor }
    ];

    for (const prop of stringProperties) {
      if (typeof prop.value === 'string' && prop.value.length > prop.maxLength) {
        threats.push({
          type: SecurityThreatType.MANIPULATION_ATTEMPT,
          severity: 'medium',
          property: prop.key,
          description: `Excessively long string detected in ${prop.key} (${prop.value.length} chars)`,
          originalValue: prop.value,
          normalizedValue: normalizeValue(prop.value),
          riskScore: Math.min(0.8, prop.value.length / (prop.maxLength * 2))
        });
      }
    }

    return threats;
  }

  /**
   * Detects encoding manipulation attempts
   */
  private detectEncodingManipulation(info: SystemInfo): SecurityThreat[] {
    const threats: SecurityThreat[] = [];
    const encodingPatterns = [
      /%[0-9a-f]{2}/gi, // URL encoding
      /\\x[0-9a-f]{2}/gi, // Hex encoding
      /\\u[0-9a-f]{4}/gi, // Unicode encoding
      /&#\d+;/gi, // HTML entity encoding
      /&[a-z]+;/gi // Named HTML entities
    ];

    const stringProperties = [
      { key: 'userAgent', value: info.userAgent },
      { key: 'platform', value: info.platform },
      { key: 'timezone', value: info.timezone },
      { key: 'vendor', value: info.vendor }
    ];

    for (const prop of stringProperties) {
      if (typeof prop.value === 'string') {
        let encodingCount = 0;
        for (const pattern of encodingPatterns) {
          const matches = prop.value.match(pattern);
          if (matches) {
            encodingCount += matches.length;
          }
        }

        // If more than 10% of the string is encoded, it's suspicious
        const encodingRatio = encodingCount / Math.max(prop.value.length / 3, 1);
        if (encodingRatio > 0.1) {
          threats.push({
            type: SecurityThreatType.MANIPULATION_ATTEMPT,
            severity: 'low',
            property: prop.key,
            description: `Suspicious encoding patterns detected in ${prop.key}`,
            originalValue: prop.value,
            normalizedValue: normalizeValue(prop.value),
            riskScore: Math.min(0.6, encodingRatio)
          });
        }
      }
    }

    return threats;
  }

  /**
   * Detects font manipulation attempts
   */
  private detectFontManipulation(fontPreferences: any): SecurityThreat[] {
    const threats: SecurityThreat[] = [];
    
    if (!fontPreferences || !Array.isArray(fontPreferences.detectedFonts)) {
      return threats;
    }

    const fonts = fontPreferences.detectedFonts;
    
    // Check for suspicious font names
    const suspiciousFontPatterns = [
      /fake|mock|test|dummy|bot/i,
      /<script|javascript:/i,
      /\.\.|\/|\\|%2e|%2f|%5c/i // Path traversal in font names
    ];

    for (const font of fonts) {
      if (typeof font === 'string') {
        for (const pattern of suspiciousFontPatterns) {
          if (pattern.test(font)) {
            threats.push({
              type: SecurityThreatType.MANIPULATION_ATTEMPT,
              severity: 'low',
              property: 'fontPreferences',
              description: `Suspicious font name detected: ${font}`,
              originalValue: font,
              normalizedValue: normalizeValue(font),
              riskScore: 0.4
            });
            break;
          }
        }
      }
    }

    // Check for unusual font list patterns
    if (fonts.length === 0) {
      threats.push({
        type: SecurityThreatType.FINGERPRINT_EVASION,
        severity: 'low',
        property: 'fontPreferences',
        description: 'No fonts detected - possible font enumeration blocking',
        originalValue: fonts,
        normalizedValue: normalizeValue(fonts),
        riskScore: 0.3
      });
    } else if (fonts.length > 500) {
      threats.push({
        type: SecurityThreatType.MANIPULATION_ATTEMPT,
        severity: 'medium',
        property: 'fontPreferences',
        description: `Unusually large font list detected (${fonts.length} fonts)`,
        originalValue: fonts.length,
        normalizedValue: fonts.length,
        riskScore: 0.5
      });
    }

    return threats;
  }

  /**
   * Detects math constant manipulation
   */
  private detectMathConstantManipulation(mathConstants: any): SecurityThreat[] {
    const threats: SecurityThreat[] = [];
    
    if (!mathConstants || typeof mathConstants !== 'object') {
      return threats;
    }

    // Expected ranges for math constants (approximate)
    const expectedRanges = {
      acos: [1.4, 1.5],
      acosh: [0.8, 0.9],
      asinh: [0.8, 0.9],
      atanh: [0.5, 0.6],
      expm1: [1.7, 1.8],
      sinh: [1.1, 1.2],
      cosh: [1.5, 1.6],
      tanh: [0.7, 0.8]
    };

    for (const [key, value] of Object.entries(mathConstants)) {
      if (typeof value === 'number') {
        const expectedRange = expectedRanges[key as keyof typeof expectedRanges];
        if (expectedRange) {
          const [min, max] = expectedRange;
          if (value < min - 0.1 || value > max + 0.1) {
            threats.push({
              type: SecurityThreatType.MANIPULATION_ATTEMPT,
              severity: 'medium',
              property: 'mathConstants',
              description: `Math constant ${key} has suspicious value: ${value}`,
              originalValue: value,
              normalizedValue: normalizeValue(value),
              riskScore: 0.6
            });
          }
        }
      }
    }

    // Check for missing or extra math constants
    const expectedKeys = Object.keys(expectedRanges);
    const actualKeys = Object.keys(mathConstants);
    
    if (actualKeys.length < expectedKeys.length * 0.5) {
      threats.push({
        type: SecurityThreatType.FINGERPRINT_EVASION,
        severity: 'low',
        property: 'mathConstants',
        description: 'Too few math constants detected - possible blocking',
        originalValue: actualKeys.length,
        normalizedValue: actualKeys.length,
        riskScore: 0.4
      });
    }

    return threats;
  }

  /**
   * Detects locale/language manipulation
   */
  private detectLocaleManipulation(info: SystemInfo): SecurityThreat[] {
    const threats: SecurityThreat[] = [];
    
    // Check for suspicious language codes
    if (Array.isArray(info.languages)) {
      for (const lang of info.languages) {
        if (typeof lang === 'string') {
          // Check for malformed language codes
          if (!/^[a-z]{2}(-[A-Z]{2})?$/.test(lang) && lang !== 'C' && lang !== 'POSIX') {
            threats.push({
              type: SecurityThreatType.MANIPULATION_ATTEMPT,
              severity: 'low',
              property: 'languages',
              description: `Malformed language code detected: ${lang}`,
              originalValue: lang,
              normalizedValue: normalizeValue(lang),
              riskScore: 0.3
            });
          }
        }
      }
    }

    // Check for timezone manipulation
    if (typeof info.timezone === 'string') {
      // Basic timezone format validation
      if (!/^[A-Za-z_]+\/[A-Za-z_]+$/.test(info.timezone) && 
          !/^UTC[+-]\d{1,2}$/.test(info.timezone) &&
          info.timezone !== 'UTC') {
        threats.push({
          type: SecurityThreatType.MANIPULATION_ATTEMPT,
          severity: 'low',
          property: 'timezone',
          description: `Malformed timezone detected: ${info.timezone}`,
          originalValue: info.timezone,
          normalizedValue: normalizeValue(info.timezone),
          riskScore: 0.3
        });
      }
    }

    return threats;
  }

  /**
   * Detects potential spoofing attempts in SystemInfo data
   * @param info - The SystemInfo object to analyze
   * @returns Array of detected spoofing threats
   */
  detectSpoofingAttempts(info: SystemInfo): SecurityThreat[] {
    const threats: SecurityThreat[] = [];

    // Check for platform/OS inconsistencies
    if (this.hasPlatformInconsistencies(info)) {
      threats.push({
        type: SecurityThreatType.SPOOFING_ATTEMPT,
        severity: 'high',
        property: 'platform',
        description: 'Platform/OS inconsistencies suggest spoofing',
        originalValue: {
          platform: info.platform,
          os: info.os,
          userAgent: info.userAgent
        },
        normalizedValue: null,
        riskScore: 0.8
      });
    }

    // Check for WebGL spoofing
    if (this.hasWebGLSpoofing(info.webGL)) {
      threats.push({
        type: SecurityThreatType.SPOOFING_ATTEMPT,
        severity: 'medium',
        property: 'webGL',
        description: 'WebGL information appears to be spoofed',
        originalValue: info.webGL,
        normalizedValue: normalizeValue(info.webGL),
        riskScore: 0.6
      });
    }

    // Check for timezone spoofing
    if (this.hasTimezoneSpoofing(info)) {
      threats.push({
        type: SecurityThreatType.SPOOFING_ATTEMPT,
        severity: 'low',
        property: 'timezone',
        description: 'Timezone information may be spoofed',
        originalValue: info.timezone,
        normalizedValue: normalizeValue(info.timezone),
        riskScore: 0.4
      });
    }

    return threats;
  }

  /**
   * Calculates entropy of a data structure
   * @param data - The data to calculate entropy for
   * @returns The entropy value (0-1 normalized)
   */
  private calculateEntropy(data: any): number {
    const serialized = JSON.stringify(data);
    const charFrequency = new Map<string, number>();
    
    // Count character frequencies
    for (const char of serialized) {
      charFrequency.set(char, (charFrequency.get(char) || 0) + 1);
    }
    
    // Calculate Shannon entropy
    let entropy = 0;
    const totalChars = serialized.length;
    
    for (const frequency of charFrequency.values()) {
      const probability = frequency / totalChars;
      entropy -= probability * Math.log2(probability);
    }
    
    // Normalize entropy (max possible entropy for this length)
    const maxEntropy = Math.log2(Math.min(totalChars, 256)); // Assuming 256 possible characters
    return maxEntropy > 0 ? entropy / maxEntropy : 0;
  }

  /**
   * Calculates uniqueness score based on data distribution
   * @param data - The data to analyze
   * @returns Uniqueness score (0-1)
   */
  private calculateUniquenessScore(data: any): number {
    const analysis = this.analyzeDistribution(data);
    
    // Higher uniqueness when more unique values and lower frequency of most common value
    const uniquenessRatio = analysis.uniqueValues / Math.max(analysis.totalValues, 1);
    const frequencyPenalty = analysis.mostCommonValueFrequency / Math.max(analysis.totalValues, 1);
    
    return Math.max(0, uniquenessRatio - frequencyPenalty);
  }

  /**
   * Analyzes the distribution of values in a data structure
   * @param data - The data to analyze
   * @returns DistributionAnalysis with detailed statistics
   */
  private analyzeDistribution(data: any): DistributionAnalysis {
    const values: any[] = [];
    this.extractValues(data, values);
    
    const valueFrequency = new Map<string, number>();
    
    for (const value of values) {
      const key = JSON.stringify(value);
      valueFrequency.set(key, (valueFrequency.get(key) || 0) + 1);
    }
    
    let mostCommonValue: any = null;
    let mostCommonValueFrequency = 0;
    
    for (const [key, frequency] of valueFrequency.entries()) {
      if (frequency > mostCommonValueFrequency) {
        mostCommonValueFrequency = frequency;
        try {
          mostCommonValue = JSON.parse(key);
        } catch (e) {
          // Handle cases where the key is not valid JSON (like "undefined")
          mostCommonValue = key;
        }
      }
    }
    
    const uniqueValues = valueFrequency.size;
    const totalValues = values.length;
    const uniformityScore = uniqueValues / Math.max(totalValues, 1);
    
    return {
      uniqueValues,
      totalValues,
      mostCommonValue,
      mostCommonValueFrequency,
      uniformityScore
    };
  }

  /**
   * Recursively extracts all values from a data structure
   * @param data - The data structure to extract from
   * @param values - Array to collect values in
   */
  private extractValues(data: any, values: any[]): void {
    if (Array.isArray(data)) {
      for (const item of data) {
        this.extractValues(item, values);
      }
    } else if (data && typeof data === 'object') {
      for (const value of Object.values(data)) {
        this.extractValues(value, values);
      }
    } else {
      values.push(data);
    }
  }

  /**
   * Assesses collision risk based on normalized data
   * @param normalizedInfo - The normalized SystemInfo object
   * @returns Collision risk score (0-1)
   */
  private assessCollisionRisk(normalizedInfo: any): number {
    const analysis = this.analyzeDistribution(normalizedInfo);
    
    // Higher collision risk when fewer unique values or high frequency of common values
    const diversityScore = analysis.uniqueValues / Math.max(analysis.totalValues, 1);
    const commonValueRisk = analysis.mostCommonValueFrequency / Math.max(analysis.totalValues, 1);
    
    // Base collision risk calculation - more aggressive detection
    let collisionRisk = Math.max(0, (commonValueRisk - diversityScore) * 0.8);
    
    // Only add additional risk factors if base risk is already elevated
    if (collisionRisk > 0.05) {
      collisionRisk += this.assessHashCollisionAttempts(normalizedInfo) * 0.4;
      collisionRisk += this.assessEntropyManipulation(normalizedInfo) * 0.4;
      collisionRisk += this.assessFingerprintHomogenization(normalizedInfo) * 0.4;
      
      // Additional checks for specific collision patterns
      if (this.hasUniformDataPattern(normalizedInfo)) {
        collisionRisk += 0.2;
      }
      
      if (this.hasRepeatedValuePattern(normalizedInfo)) {
        collisionRisk += 0.1;
      }
    }
    
    return Math.min(1.0, collisionRisk);
  }

  /**
   * Detects potential hash collision attempts through suspicious data patterns
   * @param normalizedInfo - The normalized SystemInfo object
   * @returns Risk score contribution (0-0.5)
   */
  private assessHashCollisionAttempts(normalizedInfo: any): number {
    let riskScore = 0;
    
    // Check for artificially uniform data (potential collision attempt)
    const uniformityThreshold = 0.9;
    const analysis = this.analyzeDistribution(normalizedInfo);
    
    if (analysis.uniformityScore > uniformityThreshold) {
      riskScore += 0.3; // High risk for overly uniform data
    }
    
    // Check for repeated patterns across different properties
    const repeatedPatternRisk = this.detectRepeatedPatterns(normalizedInfo);
    riskScore += repeatedPatternRisk;
    
    // Check for common fallback values being used excessively
    const fallbackOveruseRisk = this.detectFallbackOveruse(normalizedInfo);
    riskScore += fallbackOveruseRisk;
    
    return Math.min(0.5, riskScore);
  }

  /**
   * Detects entropy manipulation attempts
   * @param normalizedInfo - The normalized SystemInfo object
   * @returns Risk score contribution (0-0.3)
   */
  private assessEntropyManipulation(normalizedInfo: any): number {
    let riskScore = 0;
    
    // Check for artificially low entropy in high-entropy fields
    const highEntropyFields = [
      'webGLImageHash', 
      'canvasFingerprint', 
      'audioFingerprint',
      'canvasGeometry',
      'canvasText',
      'userAgent',
      'detectedFontsString'
    ];
    
    for (const field of highEntropyFields) {
      const value = this.getNestedValue(normalizedInfo, field);
      if (value && typeof value === 'string') {
        const entropy = this.calculateStringEntropy(value);
        // More aggressive entropy detection - lowered threshold
        if (entropy < 0.4 && value.length > 3) { 
          riskScore += 0.1;
        }
        
        // Check for obvious manipulation patterns
        if (this.hasManipulationPatterns(value)) {
          riskScore += 0.05;
        }
      }
    }
    
    // Check for overall entropy reduction
    const overallEntropy = this.calculateEntropy(normalizedInfo);
    if (overallEntropy < 0.5) {
      riskScore += 0.1;
    }
    
    return Math.min(0.3, riskScore);
  }

  /**
   * Detects fingerprint homogenization attempts (making fingerprints too similar)
   * @param normalizedInfo - The normalized SystemInfo object
   * @returns Risk score contribution (0-0.2)
   */
  private assessFingerprintHomogenization(normalizedInfo: any): number {
    let riskScore = 0;
    
    // Check for common "generic" values that reduce uniqueness
    const genericValues = [
      'unknown', 'default', 'generic', 'standard', 'common',
      'unavailable', 'blocked', 'disabled', 'error', '',
      'same', 'test', 'fake', 'mock', 'dummy'
    ];
    
    const totalProperties = this.countTotalProperties(normalizedInfo);
    let genericCount = 0;
    
    this.countGenericValues(normalizedInfo, genericValues, (count) => {
      genericCount += count;
    });
    
    const genericRatio = genericCount / Math.max(totalProperties, 1);
    // More aggressive detection - lowered thresholds
    if (genericRatio > 0.4) { // More than 40% generic values
      riskScore += 0.2;
    } else if (genericRatio > 0.2) { // More than 20% generic values
      riskScore += 0.1;
    }
    
    // Check for repeated identical values across different properties
    if (this.hasIdenticalPropertyValues(normalizedInfo)) {
      riskScore += 0.1;
    }
    
    return riskScore;
  }

  /**
   * Detects repeated patterns across different properties
   * @param normalizedInfo - The normalized SystemInfo object
   * @returns Risk score (0-0.2)
   */
  private detectRepeatedPatterns(normalizedInfo: any): number {
    const values: string[] = [];
    this.extractStringValues(normalizedInfo, values);
    
    if (values.length < 2) return 0;
    
    // Count occurrences of each value
    const valueCount = new Map<string, number>();
    for (const value of values) {
      valueCount.set(value, (valueCount.get(value) || 0) + 1);
    }
    
    // Calculate how many values appear multiple times
    const repeatedValues = Array.from(valueCount.values()).filter(count => count > 1);
    const repetitionRatio = repeatedValues.length / values.length;
    
    return Math.min(0.2, repetitionRatio * 0.4);
  }

  /**
   * Detects overuse of fallback values which may indicate manipulation
   * @param normalizedInfo - The normalized SystemInfo object
   * @returns Risk score (0-0.2)
   */
  private detectFallbackOveruse(normalizedInfo: any): number {
    const fallbackIndicators = [
      '_unavailable_', '_blocked_', '_error_', '_fallback_',
      'unavailable', 'blocked', 'error', 'fallback', 'default'
    ];
    
    let fallbackCount = 0;
    const totalProperties = this.countTotalProperties(normalizedInfo);
    
    this.countGenericValues(normalizedInfo, fallbackIndicators, (count) => {
      fallbackCount += count;
    });
    
    const fallbackRatio = fallbackCount / Math.max(totalProperties, 1);
    
    // High fallback usage might indicate manipulation or system compromise
    if (fallbackRatio > 0.3) {
      return Math.min(0.2, fallbackRatio * 0.5);
    }
    
    return 0;
  }

  // Helper methods for enhanced collision detection

  private calculateStringEntropy(str: string): number {
    if (!str || str.length === 0) return 0;
    
    const charFreq = new Map<string, number>();
    for (const char of str) {
      charFreq.set(char, (charFreq.get(char) || 0) + 1);
    }
    
    let entropy = 0;
    for (const freq of charFreq.values()) {
      const probability = freq / str.length;
      entropy -= probability * Math.log2(probability);
    }
    
    // Normalize by maximum possible entropy for this string length
    const maxEntropy = Math.log2(Math.min(str.length, 256));
    return maxEntropy > 0 ? entropy / maxEntropy : 0;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private countTotalProperties(obj: any): number {
    let count = 0;
    
    if (Array.isArray(obj)) {
      for (const item of obj) {
        count += this.countTotalProperties(item);
      }
    } else if (obj && typeof obj === 'object') {
      for (const value of Object.values(obj)) {
        if (value !== null && value !== undefined) {
          if (typeof value === 'object') {
            count += this.countTotalProperties(value);
          } else {
            count += 1;
          }
        }
      }
    } else {
      count = 1;
    }
    
    return count;
  }

  private countGenericValues(obj: any, genericValues: string[], callback: (count: number) => void): void {
    let count = 0;
    
    if (Array.isArray(obj)) {
      for (const item of obj) {
        this.countGenericValues(item, genericValues, (subCount) => count += subCount);
      }
    } else if (obj && typeof obj === 'object') {
      for (const value of Object.values(obj)) {
        this.countGenericValues(value, genericValues, (subCount) => count += subCount);
      }
    } else if (typeof obj === 'string') {
      const lowerValue = obj.toLowerCase();
      if (genericValues.some(generic => lowerValue.includes(generic))) {
        count += 1;
      }
    }
    
    callback(count);
  }

  private extractStringValues(obj: any, values: string[]): void {
    if (Array.isArray(obj)) {
      for (const item of obj) {
        this.extractStringValues(item, values);
      }
    } else if (obj && typeof obj === 'object') {
      for (const value of Object.values(obj)) {
        this.extractStringValues(value, values);
      }
    } else if (typeof obj === 'string' && obj.length > 0) {
      values.push(obj);
    }
  }

  /**
   * Checks for uniform data patterns that suggest collision attempts
   * @param normalizedInfo - The normalized data to check
   * @returns True if uniform patterns detected
   */
  private hasUniformDataPattern(normalizedInfo: any): boolean {
    const serialized = JSON.stringify(normalizedInfo);
    
    // Check for excessive repetition of characters
    const charCounts = new Map<string, number>();
    for (const char of serialized) {
      charCounts.set(char, (charCounts.get(char) || 0) + 1);
    }
    
    const maxCount = Math.max(...charCounts.values());
    const uniformityRatio = maxCount / serialized.length;
    
    return uniformityRatio > 0.6; // More than 60% of characters are the same
  }

  /**
   * Checks for repeated value patterns across properties
   * @param normalizedInfo - The normalized data to check
   * @returns True if repeated patterns detected
   */
  private hasRepeatedValuePattern(normalizedInfo: any): boolean {
    const values: any[] = [];
    this.extractValues(normalizedInfo, values);
    
    if (values.length < 3) return false;
    
    const valueFreq = new Map<string, number>();
    for (const value of values) {
      const key = JSON.stringify(value);
      valueFreq.set(key, (valueFreq.get(key) || 0) + 1);
    }
    
    // Check if any value appears more than 70% of the time
    const maxFreq = Math.max(...valueFreq.values());
    return maxFreq / values.length > 0.7;
  }

  /**
   * Extracts property values for analysis
   * @param obj - Object to extract from
   * @returns Array of property values
   */
  private extractPropertyValues(obj: any): any[] {
    const values: any[] = [];
    this.extractValues(obj, values);
    return values;
  }

  /**
   * Counts duplicate values in an array
   * @param values - Array of values to check
   * @returns Number of duplicate values
   */
  private countDuplicateValues(values: any[]): number {
    const seen = new Set();
    let duplicates = 0;
    
    for (const value of values) {
      const key = JSON.stringify(value);
      if (seen.has(key)) {
        duplicates++;
      } else {
        seen.add(key);
      }
    }
    
    return duplicates;
  }

  /**
   * Checks for suspicious value patterns
   * @param normalizedInfo - The normalized data to check
   * @returns True if suspicious patterns detected
   */
  private hasSuspiciousValuePatterns(normalizedInfo: any): boolean {
    const values = this.extractPropertyValues(normalizedInfo);
    
    // Check for all zeros
    if (values.every(v => v === 0 || v === '0' || v === null || v === undefined)) {
      return true;
    }
    
    // Check for all same non-zero values
    if (values.length > 1) {
      const firstValue = JSON.stringify(values[0]);
      if (values.every(v => JSON.stringify(v) === firstValue)) {
        return true;
      }
    }
    
    // Check for sequential patterns (1,2,3,4... or a,b,c,d...)
    if (this.hasSequentialPattern(values)) {
      return true;
    }
    
    return false;
  }

  /**
   * Checks for sequential patterns in values
   * @param values - Array of values to check
   * @returns True if sequential pattern detected
   */
  private hasSequentialPattern(values: any[]): boolean {
    if (values.length < 3) return false;
    
    // Check numeric sequences
    const numericValues = values.filter(v => typeof v === 'number').sort((a, b) => a - b);
    if (numericValues.length >= 3) {
      let sequential = 0;
      for (let i = 1; i < numericValues.length; i++) {
        if (numericValues[i] === numericValues[i-1] + 1) {
          sequential++;
        }
      }
      if (sequential >= numericValues.length * 0.7) return true;
    }
    
    // Check string sequences
    const stringValues = values.filter(v => typeof v === 'string' && v.length === 1);
    if (stringValues.length >= 3) {
      const sorted = stringValues.sort();
      let sequential = 0;
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].charCodeAt(0) === sorted[i-1].charCodeAt(0) + 1) {
          sequential++;
        }
      }
      if (sequential >= sorted.length * 0.7) return true;
    }
    
    return false;
  }

  /**
   * Calculates manipulation resistance score
   * @param originalInfo - Original SystemInfo
   * @param normalizedInfo - Normalized SystemInfo
   * @returns Manipulation resistance score (0-1)
   */
  private calculateManipulationResistance(originalInfo: SystemInfo, normalizedInfo: any): number {
    let resistanceScore = 1.0;
    
    // Penalize for easily manipulable properties
    const manipulableProperties = ['userAgent', 'platform', 'languages', 'timezone'];
    const totalProperties = Object.keys(originalInfo).length;
    const manipulableRatio = manipulableProperties.length / totalProperties;
    
    resistanceScore -= manipulableRatio * 0.3;
    
    // Bonus for hardware-based properties that are harder to manipulate
    const hardwareProperties = ['hardwareConcurrency', 'deviceMemory', 'screenResolution', 'colorDepth'];
    let hardwareScore = 0;
    
    for (const prop of hardwareProperties) {
      if (originalInfo[prop as keyof SystemInfo] !== null && originalInfo[prop as keyof SystemInfo] !== undefined) {
        hardwareScore += 0.1;
      }
    }
    
    resistanceScore += hardwareScore;
    
    return Math.max(0, Math.min(1, resistanceScore));
  }

  // Helper methods for specific threat detection

  private isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
      /HeadlessChrome/i,
      /PhantomJS/i,
      /SlimerJS/i,
      /HtmlUnit/i,
      /bot|crawler|spider/i,
      /automated|selenium|webdriver/i,
      // Enhanced patterns for manipulation detection
      /puppeteer/i,
      /playwright/i,
      /chromedriver/i,
      /geckodriver/i,
      /safaridriver/i,
      /edgedriver/i,
      /fake|mock|test|dummy/i,
      // Detect unusual version patterns
      /Chrome\/0\./i,
      /Firefox\/0\./i,
      /Safari\/0\./i,
      // Detect missing or malformed version info
      /Chrome\/$/i,
      /Firefox\/$/i,
      /Safari\/$/i,
      // Detect script injection attempts in user agent
      /<script|javascript:|on\w+=/i,
      // Detect SQL injection patterns
      /('|(\\x27)|(\\x2D\\x2D)|(%27)|(%2D%2D))/i,
      /(union|select|insert|delete|update|drop|create|alter|exec)/i
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }

  private hasInconsistentHardware(info: SystemInfo): boolean {
    // Check for impossible hardware combinations
    if (typeof info.hardwareConcurrency === 'number' && info.hardwareConcurrency > 128) return true; // Unrealistic CPU count
    if (info.deviceMemory && info.deviceMemory > 32) return true; // Unrealistic memory
    
    // Check screen resolution consistency
    if (Array.isArray(info.screenResolution) && info.screenResolution.length === 2) {
      const [width, height] = info.screenResolution;
      if (width > 8192 || height > 8192) return true; // Unrealistic resolution
      if (width < 320 || height < 240) return true; // Too small for modern devices
    }
    
    return false;
  }

  private hasSuspiciousPlugins(plugins: any[]): boolean {
    if (!Array.isArray(plugins)) return false;
    
    // Check for plugin spoofing indicators
    const suspiciousNames = ['fake', 'spoof', 'mock', 'test', 'dummy', 'bot', 'automated'];
    const suspiciousDescriptions = ['fake', 'spoof', 'mock', 'test', 'dummy', 'automated', 'headless'];
    
    // Check for suspicious plugin names or descriptions
    const hasSuspiciousContent = plugins.some(plugin => {
      if (!plugin || typeof plugin !== 'object') return false;
      
      const name = (plugin.name || '').toLowerCase();
      const description = (plugin.description || '').toLowerCase();
      
      return suspiciousNames.some(suspicious => name.includes(suspicious)) ||
             suspiciousDescriptions.some(suspicious => description.includes(suspicious));
    });
    
    // Check for unusual plugin patterns
    const hasUnusualPatterns = this.detectUnusualPluginPatterns(plugins);
    
    return hasSuspiciousContent || hasUnusualPatterns;
  }

  /**
   * Detects unusual plugin patterns that may indicate manipulation
   * @param plugins - Array of plugin objects to analyze
   * @returns True if unusual patterns are detected
   */
  private detectUnusualPluginPatterns(plugins: any[]): boolean {
    if (!Array.isArray(plugins) || plugins.length === 0) return false;
    
    // Check for duplicate plugin names (unusual)
    const pluginNames = plugins.map(p => p?.name).filter(Boolean);
    const uniqueNames = new Set(pluginNames);
    if (pluginNames.length !== uniqueNames.size) return true;
    
    // Check for plugins with empty or missing MIME types (suspicious)
    const pluginsWithoutMimeTypes = plugins.filter(p => 
      !p?.mimeTypes || !Array.isArray(p.mimeTypes) || p.mimeTypes.length === 0
    );
    if (pluginsWithoutMimeTypes.length > plugins.length * 0.5) return true;
    
    // Check for plugins with suspicious MIME type patterns
    const hasSuspiciousMimeTypes = plugins.some(plugin => {
      if (!plugin?.mimeTypes || !Array.isArray(plugin.mimeTypes)) return false;
      
      return plugin.mimeTypes.some((mimeType: any) => {
        const type = (mimeType?.type || '').toLowerCase();
        return type.includes('fake') || type.includes('mock') || type.includes('test');
      });
    });
    
    return hasSuspiciousMimeTypes;
  }

  private hasCanvasEvasion(canvas: any): boolean {
    if (!canvas) return false;
    
    // Check for common canvas evasion patterns
    const suspiciousGeometry = ['', 'blocked', 'disabled', 'error'];
    const suspiciousText = ['', 'blocked', 'disabled', 'error'];
    
    return suspiciousGeometry.includes(canvas.geometry) || 
           suspiciousText.includes(canvas.text);
  }

  private hasPlatformInconsistencies(info: SystemInfo): boolean {
    // Check for platform/OS/userAgent inconsistencies
    if (!info.platform || !info.userAgent || !info.os || !info.os.os) {
      return false; // Can't check inconsistencies without data
    }
    
    // Ensure all values are strings before calling toLowerCase
    if (typeof info.platform !== 'string' || typeof info.userAgent !== 'string' || typeof info.os.os !== 'string') {
      return false; // Invalid data types
    }
    
    const platform = info.platform.toLowerCase();
    const userAgent = info.userAgent.toLowerCase();
    const osName = info.os.os.toLowerCase();
    
    // Windows inconsistencies
    if (platform.includes('win') && !userAgent.includes('windows') && !osName.includes('windows')) {
      return true;
    }
    
    // Mac inconsistencies
    if (platform.includes('mac') && !userAgent.includes('mac') && !osName.includes('mac')) {
      return true;
    }
    
    // Linux inconsistencies
    if (platform.includes('linux') && !userAgent.includes('linux') && !osName.includes('linux')) {
      return true;
    }
    
    return false;
  }

  private hasWebGLSpoofing(webGL: any): boolean {
    if (!webGL || !webGL.vendor || !webGL.renderer) return false;
    
    // Check for common WebGL spoofing indicators
    const suspiciousVendors = ['', 'blocked', 'disabled', 'google inc.'];
    const suspiciousRenderers = ['', 'blocked', 'disabled', 'swiftshader'];
    
    return suspiciousVendors.includes(webGL.vendor.toLowerCase()) ||
           suspiciousRenderers.includes(webGL.renderer.toLowerCase());
  }

  private hasTimezoneSpoofing(info: SystemInfo): boolean {
    // This is a simplified check - in practice, you might compare with IP geolocation
    if (!info.timezone || !Array.isArray(info.languages)) {
      return false;
    }
    
    const timezone = info.timezone;
    const languages = info.languages;
    
    // Check for very obvious mismatches (very conservative to reduce false positives)
    // Only flag extremely obvious mismatches
    const obviousMismatches = [
      // Chinese timezone with only US English
      { timezone: 'Asia/Shanghai', language: 'en-US', exclusive: true },
      { timezone: 'Asia/Beijing', language: 'en-US', exclusive: true },
      // Russian timezone with only US English  
      { timezone: 'Europe/Moscow', language: 'en-US', exclusive: true },
      // Japanese timezone with only US English
      { timezone: 'Asia/Tokyo', language: 'en-US', exclusive: true }
    ];
    
    for (const mismatch of obviousMismatches) {
      if (timezone.includes(mismatch.timezone)) {
        if (mismatch.exclusive) {
          // Check if ONLY the mismatched language is present
          if (languages.length === 1 && languages[0] === mismatch.language) {
            return true;
          }
        } else {
          // Check if the mismatched language is present
          if (languages.some(lang => lang.startsWith(mismatch.language))) {
            return true;
          }
        }
      }
    }
    
    return false;
  }

  /**
   * Checks for manipulation patterns in strings
   * @param value - String value to check
   * @returns True if manipulation patterns detected
   */
  private hasManipulationPatterns(value: string): boolean {
    // Check for obvious fake/test patterns
    const fakePatterns = [
      /fake|test|mock|dummy|placeholder/i,
      /^(a+|1+|0+|x+)$/i, // Repeated single characters
      /^(abc|123|xyz|test)$/i, // Common test values
      /blocked|unavailable|error|null/i
    ];
    
    for (const pattern of fakePatterns) {
      if (pattern.test(value)) {
        return true;
      }
    }
    
    // Check for very low character diversity
    const uniqueChars = new Set(value.toLowerCase()).size;
    const diversityRatio = uniqueChars / value.length;
    
    return diversityRatio < 0.3 && value.length > 5;
  }



  /**
   * Checks for identical values across different properties
   * @param normalizedInfo - The normalized data to check
   * @returns True if identical values found across properties
   */
  private hasIdenticalPropertyValues(normalizedInfo: any): boolean {
    const values = this.extractPropertyValues(normalizedInfo);
    if (values.length < 2) return false;
    
    const valueMap = new Map<string, number>();
    for (const value of values) {
      const key = JSON.stringify(value);
      valueMap.set(key, (valueMap.get(key) || 0) + 1);
    }
    
    // Check if any value appears in more than 30% of properties
    const maxCount = Math.max(...valueMap.values());
    return maxCount / values.length > 0.3;
  }
}

/**
 * Default instance of SecurityValidator for general use
 */
export const defaultSecurityValidator = new SecurityValidator();