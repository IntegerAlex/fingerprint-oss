/*!
 * Copyright (c) 2025 Akshat Kotpalliwar (alias IntegerAlex on GitHub)
 * This software is licensed under the GNU Lesser General Public License (LGPL) v3 or later.
 *
 * You are free to use, modify, and redistribute this software, but modifications must also be licensed under the LGPL.
 * This project is distributed without any warranty; see the LGPL for more details.
 *
 * For a full copy of the LGPL and ethical contribution guidelines, please refer to the `COPYRIGHT.md` and `NOTICE.md` files.
 */

import { SystemInfo } from './types';
import { SecurityValidator, SecurityValidationResult, SecurityThreatType } from './security';

/**
 * Enum defining different types of validation errors
 */
export enum ValidationErrorType {
  MALFORMED_DATA = 'malformed_data',
  SUSPICIOUS_INPUT = 'suspicious_input',
  TYPE_MISMATCH = 'type_mismatch',
  RANGE_VIOLATION = 'range_violation',
  SECURITY_VIOLATION = 'security_violation'
}

/**
 * Interface representing a validation error
 */
export interface ValidationError {
  property: string;
  type: ValidationErrorType;
  message: string;
  originalValue: any;
  suggestedValue?: any;
}

/**
 * Result of input validation
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  sanitizedData: SystemInfo;
  securityValidation?: SecurityValidationResult;
}

/**
 * Configuration for validation rules
 */
export interface ValidationConfig {
  strictMode: boolean;
  allowPartialData: boolean;
  maxStringLength: number;
  maxArrayLength: number;
  enableSecurityChecks: boolean;
  enableEntropyValidation: boolean;
  enableManipulationResistance: boolean;
}

/**
 * Default validation configuration
 */
export const DEFAULT_VALIDATION_CONFIG: ValidationConfig = {
  strictMode: false,
  allowPartialData: true,
  maxStringLength: 10000,
  maxArrayLength: 1000,
  enableSecurityChecks: true,
  enableEntropyValidation: true,
  enableManipulationResistance: true
};

/**
 * Engine for validating and sanitizing SystemInfo input data
 */
export class ValidationEngine {
  private config: ValidationConfig;
  private securityValidator: SecurityValidator;

  constructor(config: Partial<ValidationConfig> = {}) {
    this.config = { ...DEFAULT_VALIDATION_CONFIG, ...config };
    this.securityValidator = new SecurityValidator({
      enableManipulationDetection: this.config.enableManipulationResistance,
      enableSpoofingDetection: this.config.enableSecurityChecks,
      strictMode: this.config.strictMode
    });
  }

  /**
   * Validates SystemInfo data and returns validation results with sanitized data
   * @param info - The SystemInfo object to validate
   * @returns ValidationResult containing validation status, errors, and sanitized data
   */
  validateSystemInfo(info: SystemInfo): ValidationResult {
    const errors: ValidationError[] = [];
    
    // Validate the original data first to catch issues before sanitization
    this.validateIncognito(info.incognito, errors);
    this.validateBot(info.bot, errors);
    this.validateUserAgent(info.userAgent, errors);
    this.validatePlatform(info.platform, errors);
    this.validateLanguages(info.languages, errors);
    this.validateScreenResolution(info.screenResolution, errors);
    this.validateColorDepth(info.colorDepth, errors);
    this.validateColorGamut(info.colorGamut, errors);
    this.validateHardwareConcurrency(info.hardwareConcurrency, errors);
    this.validateDeviceMemory(info.deviceMemory, errors);
    this.validateOS(info.os, errors);
    this.validateAudio(info.audio, errors);
    this.validateWebGL(info.webGL, errors);
    this.validateCanvas(info.canvas, errors);
    this.validatePlugins(info.plugins, errors);
    this.validateTimezone(info.timezone, errors);
    this.validateTouchSupport(info.touchSupport, errors);
    this.validateVendor(info.vendor, errors);
    this.validateVendorFlavors(info.vendorFlavors, errors);
    this.validateMathConstants(info.mathConstants, errors);
    this.validateFontPreferences(info.fontPreferences, errors);
    this.validateConfidenceScore(info.confidenceScore, errors);

    // Then sanitize the data for the output
    const sanitizedData = this.sanitizeInput(info);

    // Check for malicious input patterns
    if (this.config.enableSecurityChecks && this.detectMaliciousInput(sanitizedData)) {
      errors.push({
        property: 'global',
        type: ValidationErrorType.SECURITY_VIOLATION,
        message: 'Potentially malicious input patterns detected',
        originalValue: info
      });
    }

    // Perform enhanced security validation
    let securityValidation: SecurityValidationResult | undefined;
    if (this.config.enableSecurityChecks || this.config.enableEntropyValidation || this.config.enableManipulationResistance) {
      const normalizedData = this.normalizeForSecurityCheck(sanitizedData);
      securityValidation = this.securityValidator.validateSecurity(sanitizedData, normalizedData);
      
      // Add security threats as validation errors
      for (const threat of securityValidation.threats) {
        const errorType = this.mapThreatToErrorType(threat.type);
        errors.push({
          property: threat.property,
          type: errorType,
          message: threat.description,
          originalValue: threat.originalValue
        });
      }
    }

    const hasSecurityViolations = errors.some(e => e.type === ValidationErrorType.SECURITY_VIOLATION);
    const hasCriticalErrors = errors.some(e => 
      e.type === ValidationErrorType.SECURITY_VIOLATION || 
      e.type === ValidationErrorType.TYPE_MISMATCH || 
      e.type === ValidationErrorType.RANGE_VIOLATION
    );
    
    // Determine validity based on configuration
    let isValid: boolean;
    
    if (errors.length === 0) {
      isValid = true;
    } else if (this.config.strictMode) {
      // In strict mode, any critical errors make it invalid
      isValid = !hasCriticalErrors;
    } else if (this.config.allowPartialData) {
      // In lenient mode with partial data allowed, only security violations make it invalid
      isValid = !hasSecurityViolations;
    } else {
      // If partial data is not allowed, any errors make it invalid
      isValid = false;
    }
    
    return {
      isValid,
      errors,
      sanitizedData,
      securityValidation
    };
  }

  /**
   * Sanitizes input data by cleaning malformed values and applying consistent formatting
   * @param info - The SystemInfo object to sanitize
   * @returns Sanitized SystemInfo object
   */
  sanitizeInput(info: SystemInfo): SystemInfo {
    const sanitized = { ...info };

    // Sanitize strings
    if (typeof sanitized.userAgent === 'string') {
      sanitized.userAgent = this.sanitizeString(sanitized.userAgent);
    }
    if (typeof sanitized.platform === 'string') {
      sanitized.platform = this.sanitizeString(sanitized.platform);
    }
    if (typeof sanitized.colorGamut === 'string') {
      sanitized.colorGamut = this.sanitizeString(sanitized.colorGamut);
    }
    if (typeof sanitized.timezone === 'string') {
      sanitized.timezone = this.sanitizeString(sanitized.timezone);
    }
    if (typeof sanitized.vendor === 'string') {
      sanitized.vendor = this.sanitizeString(sanitized.vendor);
    }

    // Sanitize arrays
    if (Array.isArray(sanitized.languages)) {
      sanitized.languages = this.sanitizeStringArray(sanitized.languages);
    }
    if (Array.isArray(sanitized.vendorFlavors)) {
      sanitized.vendorFlavors = this.sanitizeStringArray(sanitized.vendorFlavors);
    }

    // Sanitize numeric values
    if (typeof sanitized.colorDepth === 'number') {
      sanitized.colorDepth = this.sanitizeNumber(sanitized.colorDepth, 0, 128);
    }
    if (typeof sanitized.hardwareConcurrency === 'number') {
      sanitized.hardwareConcurrency = this.sanitizeNumber(sanitized.hardwareConcurrency, 1, 512);
    }
    if (typeof sanitized.confidenceScore === 'number') {
      sanitized.confidenceScore = this.sanitizeNumber(sanitized.confidenceScore, 0, 1);
    }

    // Sanitize screen resolution
    if (Array.isArray(sanitized.screenResolution) && sanitized.screenResolution.length === 2) {
      sanitized.screenResolution = [
        this.sanitizeNumber(sanitized.screenResolution[0], 0, 32768),
        this.sanitizeNumber(sanitized.screenResolution[1], 0, 32768)
      ];
    }

    return sanitized;
  }

  /**
   * Detects potentially malicious input patterns
   * @param info - The SystemInfo object to analyze
   * @returns True if malicious patterns are detected
   */
  detectMaliciousInput(info: SystemInfo): boolean {
    // Check for script injection patterns
    const scriptPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /eval\s*\(/gi,
      /Function\s*\(/gi
    ];

    // Check for SQL injection patterns
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
      /(';|--;|\|\||\/\*|\*\/|'.*OR.*'|'.*AND.*')/gi
    ];

    // Check for path traversal patterns
    const pathTraversalPatterns = [
      /\.\.\//gi,
      /\.\.\\/gi,
      /%2e%2e%2f/gi,
      /%2e%2e%5c/gi
    ];

    const allPatterns = [...scriptPatterns, ...sqlPatterns, ...pathTraversalPatterns];

    // Check string properties
    const stringProps = [info.userAgent, info.platform, info.colorGamut, info.timezone, info.vendor];
    for (const prop of stringProps) {
      if (typeof prop === 'string') {
        for (const pattern of allPatterns) {
          if (pattern.test(prop)) {
            return true;
          }
        }
      }
    }

    // Check array properties
    const arrayProps = [info.languages, info.vendorFlavors];
    for (const arr of arrayProps) {
      if (Array.isArray(arr)) {
        for (const item of arr) {
          if (typeof item === 'string') {
            for (const pattern of allPatterns) {
              if (pattern.test(item)) {
                return true;
              }
            }
          }
        }
      }
    }

    // Check for excessively long strings (potential buffer overflow attempts)
    const maxLength = this.config.maxStringLength;
    if (typeof info.userAgent === 'string' && info.userAgent.length > maxLength) return true;
    if (typeof info.platform === 'string' && info.platform.length > maxLength) return true;

    // Check for suspicious numeric values (more lenient ranges)
    if (typeof info.colorDepth === 'number' && (info.colorDepth < 0 || info.colorDepth > 128)) return true;
    if (typeof info.hardwareConcurrency === 'number' && (info.hardwareConcurrency < 0 || info.hardwareConcurrency > 512)) return true;

    return false;
  }

  // Private validation methods for each property
  private validateIncognito(value: any, errors: ValidationError[]): void {
    if (!value || typeof value !== 'object') {
      errors.push({
        property: 'incognito',
        type: ValidationErrorType.TYPE_MISMATCH,
        message: 'Incognito must be an object with isPrivate and browserName properties',
        originalValue: value
      });
      return;
    }

    if (typeof value.isPrivate !== 'boolean') {
      errors.push({
        property: 'incognito.isPrivate',
        type: ValidationErrorType.TYPE_MISMATCH,
        message: 'isPrivate must be a boolean',
        originalValue: value.isPrivate
      });
    }

    if (typeof value.browserName !== 'string') {
      errors.push({
        property: 'incognito.browserName',
        type: ValidationErrorType.TYPE_MISMATCH,
        message: 'browserName must be a string',
        originalValue: value.browserName
      });
    }
  }

  private validateBot(value: any, errors: ValidationError[]): void {
    if (!value || typeof value !== 'object') {
      errors.push({
        property: 'bot',
        type: ValidationErrorType.TYPE_MISMATCH,
        message: 'Bot must be an object with isBot, signals, and confidence properties',
        originalValue: value
      });
      return;
    }

    if (typeof value.isBot !== 'boolean') {
      errors.push({
        property: 'bot.isBot',
        type: ValidationErrorType.TYPE_MISMATCH,
        message: 'isBot must be a boolean',
        originalValue: value.isBot
      });
    }

    if (!Array.isArray(value.signals)) {
      errors.push({
        property: 'bot.signals',
        type: ValidationErrorType.TYPE_MISMATCH,
        message: 'signals must be an array',
        originalValue: value.signals
      });
    }

    if (typeof value.confidence !== 'number' || value.confidence < 0 || value.confidence > 1) {
      errors.push({
        property: 'bot.confidence',
        type: ValidationErrorType.RANGE_VIOLATION,
        message: 'confidence must be a number between 0 and 1',
        originalValue: value.confidence
      });
    }
  }

  private validateUserAgent(value: any, errors: ValidationError[]): void {
    if (typeof value !== 'string') {
      errors.push({
        property: 'userAgent',
        type: ValidationErrorType.TYPE_MISMATCH,
        message: 'userAgent must be a string',
        originalValue: value
      });
      return;
    }

    if (value.length === 0) {
      errors.push({
        property: 'userAgent',
        type: ValidationErrorType.MALFORMED_DATA,
        message: 'userAgent cannot be empty',
        originalValue: value
      });
    }

    if (value.length > this.config.maxStringLength) {
      errors.push({
        property: 'userAgent',
        type: ValidationErrorType.RANGE_VIOLATION,
        message: `userAgent exceeds maximum length of ${this.config.maxStringLength}`,
        originalValue: value
      });
    }
  }

  private validatePlatform(value: any, errors: ValidationError[]): void {
    if (typeof value !== 'string') {
      errors.push({
        property: 'platform',
        type: ValidationErrorType.TYPE_MISMATCH,
        message: 'platform must be a string',
        originalValue: value
      });
    }
  }

  private validateLanguages(value: any, errors: ValidationError[]): void {
    if (!Array.isArray(value)) {
      errors.push({
        property: 'languages',
        type: ValidationErrorType.TYPE_MISMATCH,
        message: 'languages must be an array',
        originalValue: value
      });
      return;
    }

    if (value.length > this.config.maxArrayLength) {
      errors.push({
        property: 'languages',
        type: ValidationErrorType.RANGE_VIOLATION,
        message: `languages array exceeds maximum length of ${this.config.maxArrayLength}`,
        originalValue: value
      });
    }

    value.forEach((lang, index) => {
      if (typeof lang !== 'string') {
        errors.push({
          property: `languages[${index}]`,
          type: ValidationErrorType.TYPE_MISMATCH,
          message: 'language entries must be strings',
          originalValue: lang
        });
      }
    });
  }

  private validateScreenResolution(value: any, errors: ValidationError[]): void {
    if (!Array.isArray(value) || value.length !== 2) {
      errors.push({
        property: 'screenResolution',
        type: ValidationErrorType.TYPE_MISMATCH,
        message: 'screenResolution must be an array of two numbers',
        originalValue: value
      });
      return;
    }

    const [width, height] = value;
    if (typeof width !== 'number' || typeof height !== 'number') {
      errors.push({
        property: 'screenResolution',
        type: ValidationErrorType.TYPE_MISMATCH,
        message: 'screenResolution values must be numbers',
        originalValue: value
      });
    }

    if (width < 0 || height < 0 || width > 32768 || height > 32768) {
      errors.push({
        property: 'screenResolution',
        type: ValidationErrorType.RANGE_VIOLATION,
        message: 'screenResolution values must be between 0 and 32768',
        originalValue: value
      });
    }
  }

  private validateColorDepth(value: any, errors: ValidationError[]): void {
    if (typeof value !== 'number') {
      errors.push({
        property: 'colorDepth',
        type: ValidationErrorType.TYPE_MISMATCH,
        message: 'colorDepth must be a number',
        originalValue: value
      });
      return;
    }

    if (value < 0 || value > 128) {
      errors.push({
        property: 'colorDepth',
        type: ValidationErrorType.RANGE_VIOLATION,
        message: 'colorDepth must be between 0 and 128',
        originalValue: value
      });
    }
  }

  private validateColorGamut(value: any, errors: ValidationError[]): void {
    if (typeof value !== 'string') {
      errors.push({
        property: 'colorGamut',
        type: ValidationErrorType.TYPE_MISMATCH,
        message: 'colorGamut must be a string',
        originalValue: value
      });
    }
  }

  private validateHardwareConcurrency(value: any, errors: ValidationError[]): void {
    if (typeof value !== 'number') {
      errors.push({
        property: 'hardwareConcurrency',
        type: ValidationErrorType.TYPE_MISMATCH,
        message: 'hardwareConcurrency must be a number',
        originalValue: value
      });
      return;
    }

    if (value < 1 || value > 512) {
      errors.push({
        property: 'hardwareConcurrency',
        type: ValidationErrorType.RANGE_VIOLATION,
        message: 'hardwareConcurrency must be between 1 and 512',
        originalValue: value
      });
    }
  }

  private validateDeviceMemory(value: any, errors: ValidationError[]): void {
    if (value !== undefined && typeof value !== 'number') {
      errors.push({
        property: 'deviceMemory',
        type: ValidationErrorType.TYPE_MISMATCH,
        message: 'deviceMemory must be a number or undefined',
        originalValue: value
      });
    }
  }

  private validateOS(value: any, errors: ValidationError[]): void {
    if (!value || typeof value !== 'object') {
      errors.push({
        property: 'os',
        type: ValidationErrorType.TYPE_MISMATCH,
        message: 'os must be an object with os and version properties',
        originalValue: value
      });
      return;
    }

    if (typeof value.os !== 'string') {
      errors.push({
        property: 'os.os',
        type: ValidationErrorType.TYPE_MISMATCH,
        message: 'os.os must be a string',
        originalValue: value.os
      });
    }

    if (typeof value.version !== 'string') {
      errors.push({
        property: 'os.version',
        type: ValidationErrorType.TYPE_MISMATCH,
        message: 'os.version must be a string',
        originalValue: value.version
      });
    }
  }

  private validateAudio(value: any, errors: ValidationError[]): void {
    if (value !== null && typeof value !== 'number') {
      errors.push({
        property: 'audio',
        type: ValidationErrorType.TYPE_MISMATCH,
        message: 'audio must be a number or null',
        originalValue: value
      });
    }
  }

  private validateWebGL(value: any, errors: ValidationError[]): void {
    if (!value || typeof value !== 'object') {
      errors.push({
        property: 'webGL',
        type: ValidationErrorType.TYPE_MISMATCH,
        message: 'webGL must be an object',
        originalValue: value
      });
      return;
    }

    if (typeof value.vendor !== 'string') {
      errors.push({
        property: 'webGL.vendor',
        type: ValidationErrorType.TYPE_MISMATCH,
        message: 'webGL.vendor must be a string',
        originalValue: value.vendor
      });
    }

    if (typeof value.renderer !== 'string') {
      errors.push({
        property: 'webGL.renderer',
        type: ValidationErrorType.TYPE_MISMATCH,
        message: 'webGL.renderer must be a string',
        originalValue: value.renderer
      });
    }

    if (value.imageHash !== null && typeof value.imageHash !== 'string') {
      errors.push({
        property: 'webGL.imageHash',
        type: ValidationErrorType.TYPE_MISMATCH,
        message: 'webGL.imageHash must be a string or null',
        originalValue: value.imageHash
      });
    }
  }

  private validateCanvas(value: any, errors: ValidationError[]): void {
    if (!value || typeof value !== 'object') {
      errors.push({
        property: 'canvas',
        type: ValidationErrorType.TYPE_MISMATCH,
        message: 'canvas must be an object',
        originalValue: value
      });
      return;
    }

    if (typeof value.winding !== 'boolean') {
      errors.push({
        property: 'canvas.winding',
        type: ValidationErrorType.TYPE_MISMATCH,
        message: 'canvas.winding must be a boolean',
        originalValue: value.winding
      });
    }

    if (typeof value.geometry !== 'string') {
      errors.push({
        property: 'canvas.geometry',
        type: ValidationErrorType.TYPE_MISMATCH,
        message: 'canvas.geometry must be a string',
        originalValue: value.geometry
      });
    }

    if (typeof value.text !== 'string') {
      errors.push({
        property: 'canvas.text',
        type: ValidationErrorType.TYPE_MISMATCH,
        message: 'canvas.text must be a string',
        originalValue: value.text
      });
    }
  }

  private validatePlugins(value: any, errors: ValidationError[]): void {
    if (!Array.isArray(value)) {
      errors.push({
        property: 'plugins',
        type: ValidationErrorType.TYPE_MISMATCH,
        message: 'plugins must be an array',
        originalValue: value
      });
      return;
    }

    if (value.length > this.config.maxArrayLength) {
      errors.push({
        property: 'plugins',
        type: ValidationErrorType.RANGE_VIOLATION,
        message: `plugins array exceeds maximum length of ${this.config.maxArrayLength}`,
        originalValue: value
      });
    }

    value.forEach((plugin, index) => {
      if (!plugin || typeof plugin !== 'object') {
        errors.push({
          property: `plugins[${index}]`,
          type: ValidationErrorType.TYPE_MISMATCH,
          message: 'plugin entries must be objects',
          originalValue: plugin
        });
        return;
      }

      if (typeof plugin.name !== 'string') {
        errors.push({
          property: `plugins[${index}].name`,
          type: ValidationErrorType.TYPE_MISMATCH,
          message: 'plugin.name must be a string',
          originalValue: plugin.name
        });
      }

      if (typeof plugin.description !== 'string') {
        errors.push({
          property: `plugins[${index}].description`,
          type: ValidationErrorType.TYPE_MISMATCH,
          message: 'plugin.description must be a string',
          originalValue: plugin.description
        });
      }

      if (!Array.isArray(plugin.mimeTypes)) {
        errors.push({
          property: `plugins[${index}].mimeTypes`,
          type: ValidationErrorType.TYPE_MISMATCH,
          message: 'plugin.mimeTypes must be an array',
          originalValue: plugin.mimeTypes
        });
      }
    });
  }

  private validateTimezone(value: any, errors: ValidationError[]): void {
    if (typeof value !== 'string') {
      errors.push({
        property: 'timezone',
        type: ValidationErrorType.TYPE_MISMATCH,
        message: 'timezone must be a string',
        originalValue: value
      });
    }
  }

  private validateTouchSupport(value: any, errors: ValidationError[]): void {
    if (!value || typeof value !== 'object') {
      errors.push({
        property: 'touchSupport',
        type: ValidationErrorType.TYPE_MISMATCH,
        message: 'touchSupport must be an object',
        originalValue: value
      });
      return;
    }

    if (typeof value.maxTouchPoints !== 'number') {
      errors.push({
        property: 'touchSupport.maxTouchPoints',
        type: ValidationErrorType.TYPE_MISMATCH,
        message: 'touchSupport.maxTouchPoints must be a number',
        originalValue: value.maxTouchPoints
      });
    }

    if (typeof value.touchEvent !== 'boolean') {
      errors.push({
        property: 'touchSupport.touchEvent',
        type: ValidationErrorType.TYPE_MISMATCH,
        message: 'touchSupport.touchEvent must be a boolean',
        originalValue: value.touchEvent
      });
    }

    if (typeof value.touchStart !== 'boolean') {
      errors.push({
        property: 'touchSupport.touchStart',
        type: ValidationErrorType.TYPE_MISMATCH,
        message: 'touchSupport.touchStart must be a boolean',
        originalValue: value.touchStart
      });
    }
  }

  private validateVendor(value: any, errors: ValidationError[]): void {
    if (typeof value !== 'string') {
      errors.push({
        property: 'vendor',
        type: ValidationErrorType.TYPE_MISMATCH,
        message: 'vendor must be a string',
        originalValue: value
      });
    }
  }

  private validateVendorFlavors(value: any, errors: ValidationError[]): void {
    if (!Array.isArray(value)) {
      errors.push({
        property: 'vendorFlavors',
        type: ValidationErrorType.TYPE_MISMATCH,
        message: 'vendorFlavors must be an array',
        originalValue: value
      });
      return;
    }

    value.forEach((flavor, index) => {
      if (typeof flavor !== 'string') {
        errors.push({
          property: `vendorFlavors[${index}]`,
          type: ValidationErrorType.TYPE_MISMATCH,
          message: 'vendorFlavor entries must be strings',
          originalValue: flavor
        });
      }
    });
  }

  private validateMathConstants(value: any, errors: ValidationError[]): void {
    if (!value || typeof value !== 'object') {
      errors.push({
        property: 'mathConstants',
        type: ValidationErrorType.TYPE_MISMATCH,
        message: 'mathConstants must be an object',
        originalValue: value
      });
      return;
    }

    Object.entries(value).forEach(([key, val]) => {
      if (typeof val !== 'number') {
        errors.push({
          property: `mathConstants.${key}`,
          type: ValidationErrorType.TYPE_MISMATCH,
          message: 'mathConstants values must be numbers',
          originalValue: val
        });
      }
    });
  }

  private validateFontPreferences(value: any, errors: ValidationError[]): void {
    if (!value || typeof value !== 'object') {
      errors.push({
        property: 'fontPreferences',
        type: ValidationErrorType.TYPE_MISMATCH,
        message: 'fontPreferences must be an object',
        originalValue: value
      });
      return;
    }

    if (!Array.isArray(value.detectedFonts)) {
      errors.push({
        property: 'fontPreferences.detectedFonts',
        type: ValidationErrorType.TYPE_MISMATCH,
        message: 'fontPreferences.detectedFonts must be an array',
        originalValue: value.detectedFonts
      });
      return;
    }

    value.detectedFonts.forEach((font: any, index: number) => {
      if (typeof font !== 'string') {
        errors.push({
          property: `fontPreferences.detectedFonts[${index}]`,
          type: ValidationErrorType.TYPE_MISMATCH,
          message: 'detected font entries must be strings',
          originalValue: font
        });
      }
    });
  }

  private validateConfidenceScore(value: any, errors: ValidationError[]): void {
    if (typeof value !== 'number') {
      errors.push({
        property: 'confidenceScore',
        type: ValidationErrorType.TYPE_MISMATCH,
        message: 'confidenceScore must be a number',
        originalValue: value
      });
      return;
    }

    if (value < 0 || value > 1) {
      errors.push({
        property: 'confidenceScore',
        type: ValidationErrorType.RANGE_VIOLATION,
        message: 'confidenceScore must be between 0 and 1',
        originalValue: value
      });
    }
  }

  // Helper methods for sanitization
  private sanitizeString(value: string): string {
    return value
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .substring(0, this.config.maxStringLength); // Truncate if too long
  }

  private sanitizeStringArray(value: string[]): string[] {
    return value
      .filter(item => typeof item === 'string')
      .map(item => this.sanitizeString(item))
      .slice(0, this.config.maxArrayLength);
  }

  private sanitizeNumber(value: number, min: number, max: number): number {
    if (isNaN(value) || !isFinite(value)) {
      return min;
    }
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Maps security threat types to validation error types
   * @param threatType - The security threat type
   * @returns Corresponding validation error type
   */
  private mapThreatToErrorType(threatType: SecurityThreatType): ValidationErrorType {
    switch (threatType) {
      case SecurityThreatType.MANIPULATION_ATTEMPT:
      case SecurityThreatType.SPOOFING_ATTEMPT:
      case SecurityThreatType.FINGERPRINT_EVASION:
        return ValidationErrorType.SECURITY_VIOLATION;
      case SecurityThreatType.ENTROPY_LOSS:
      case SecurityThreatType.COLLISION_RISK:
        return ValidationErrorType.SUSPICIOUS_INPUT;
      default:
        return ValidationErrorType.SECURITY_VIOLATION;
    }
  }

  /**
   * Normalizes data for security validation (simplified normalization)
   * @param data - The data to normalize
   * @returns Normalized data for security analysis
   */
  private normalizeForSecurityCheck(data: SystemInfo): any {
    // Use dynamic import to avoid circular dependencies
    try {
      const normalizationModule = require('./normalization');
      return normalizationModule.normalizeValue(data);
    } catch (error) {
      // Fallback to basic normalization if module not available
      return this.basicNormalize(data);
    }
  }

  /**
   * Basic normalization fallback when normalization module is not available
   * @param data - The data to normalize
   * @returns Basic normalized data
   */
  private basicNormalize(data: any): any {
    if (typeof data === 'string') {
      return data.trim().replace(/\s+/g, ' ');
    } else if (typeof data === 'number') {
      return Number(data.toFixed(3));
    } else if (Array.isArray(data)) {
      return data.map(item => this.basicNormalize(item)).sort();
    } else if (data && typeof data === 'object') {
      const normalized: Record<string, any> = {};
      const sortedKeys = Object.keys(data).sort();
      for (const key of sortedKeys) {
        normalized[key] = this.basicNormalize(data[key]);
      }
      return normalized;
    }
    return data;
  }

  /**
   * Validates entropy preservation in normalized data
   * @param originalData - Original SystemInfo
   * @param normalizedData - Normalized SystemInfo
   * @returns True if entropy is adequately preserved
   */
  validateEntropyPreservation(originalData: SystemInfo, normalizedData: any): boolean {
    if (!this.config.enableEntropyValidation) {
      return true;
    }

    const entropyAnalysis = this.securityValidator.analyzeEntropy(originalData, normalizedData);
    return entropyAnalysis.entropyPreservationRatio >= 0.7; // 70% entropy preservation threshold
  }

  /**
   * Validates manipulation resistance of the fingerprint
   * @param originalData - Original SystemInfo
   * @param normalizedData - Normalized SystemInfo
   * @returns True if manipulation resistance is adequate
   */
  validateManipulationResistance(originalData: SystemInfo, normalizedData: any): boolean {
    if (!this.config.enableManipulationResistance) {
      return true;
    }

    const securityResult = this.securityValidator.validateSecurity(originalData, normalizedData);
    return securityResult.manipulationResistanceScore >= 0.6; // 60% manipulation resistance threshold
  }
}