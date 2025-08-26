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
 * Hash comparison utilities for troubleshooting fingerprint variations.
 * Provides detailed analysis of differences between SystemInfo inputs and their impact on hash generation.
 */

import { SystemInfo } from './types';
import { generateIdWithDebug, HashGeneratorConfig, HashDebugInfo } from './hash';
import { getDebugLogger, DebugLogLevel } from './debug';

/**
 * Detailed comparison result between two SystemInfo inputs
 */
export interface DetailedComparisonResult {
  identical: boolean;
  hashesMatch: boolean;
  hash1: string;
  hash2: string;
  differences: PropertyDifference[];
  normalizedDifferences: PropertyDifference[];
  impactAnalysis: ImpactAnalysis;
  debugInfo1?: HashDebugInfo;
  debugInfo2?: HashDebugInfo;
  comparisonMetadata: ComparisonMetadata;
}

/**
 * Represents a difference between two property values
 */
export interface PropertyDifference {
  property: string;
  path: string[];
  value1: any;
  value2: any;
  normalizedValue1?: any;
  normalizedValue2?: any;
  type: DifferenceType;
  severity: DifferenceSeverity;
  affectsHash: boolean;
  description: string;
}

/**
 * Types of differences that can be detected
 */
export enum DifferenceType {
  VALUE_CHANGE = 'value_change',
  TYPE_CHANGE = 'type_change',
  MISSING_PROPERTY = 'missing_property',
  ADDED_PROPERTY = 'added_property',
  ARRAY_ORDER = 'array_order',
  ARRAY_LENGTH = 'array_length',
  OBJECT_STRUCTURE = 'object_structure',
  PRECISION_DIFFERENCE = 'precision_difference',
  WHITESPACE_DIFFERENCE = 'whitespace_difference',
  ENCODING_DIFFERENCE = 'encoding_difference'
}

/**
 * Severity levels for differences
 */
export enum DifferenceSeverity {
  CRITICAL = 'critical',    // Always affects hash
  HIGH = 'high',           // Usually affects hash
  MEDIUM = 'medium',       // May affect hash depending on normalization
  LOW = 'low',            // Unlikely to affect hash after normalization
  NEGLIGIBLE = 'negligible' // Should not affect hash after normalization
}

/**
 * Analysis of how differences impact the final hash
 */
export interface ImpactAnalysis {
  totalDifferences: number;
  criticalDifferences: number;
  hashAffectingDifferences: number;
  normalizedAwayDifferences: number;
  mostSignificantDifferences: PropertyDifference[];
  hashStabilityScore: number; // 0-1, higher is more stable
  recommendations: string[];
}

/**
 * Metadata about the comparison process
 */
export interface ComparisonMetadata {
  comparisonId: string;
  timestamp: number;
  processingTime: number;
  config: HashGeneratorConfig;
  deepAnalysisEnabled: boolean;
}

/**
 * Configuration for comparison behavior
 */
export interface ComparisonConfig {
  enableDeepAnalysis?: boolean;
  includeDebugInfo?: boolean;
  maxDifferenceDepth?: number;
  ignoredProperties?: string[];
  customSeverityRules?: Record<string, DifferenceSeverity>;
}

/**
 * Hash variation analysis result
 */
export interface HashVariationAnalysis {
  inputHashes: string[];
  uniqueHashes: string[];
  variationRate: number; // Percentage of unique hashes
  commonDifferences: PropertyDifference[];
  stabilityMetrics: StabilityMetrics;
  recommendations: string[];
}

/**
 * Stability metrics for multiple hash comparisons
 */
export interface StabilityMetrics {
  consistency: number; // 0-1, higher is more consistent
  entropy: number; // Measure of hash distribution
  predictability: number; // 0-1, higher is more predictable
  robustness: number; // 0-1, resistance to minor input changes
}

/**
 * Default comparison configuration
 */
export const DEFAULT_COMPARISON_CONFIG: ComparisonConfig = {
  enableDeepAnalysis: true,
  includeDebugInfo: true,
  maxDifferenceDepth: 10,
  ignoredProperties: [],
  customSeverityRules: {}
};

/**
 * Enhanced hash comparison utility class
 */
export class HashComparator {
  private config: ComparisonConfig;
  private comparisonCounter = 0;

  constructor(config: Partial<ComparisonConfig> = {}) {
    this.config = { ...DEFAULT_COMPARISON_CONFIG, ...config };
  }

  /**
   * Performs detailed comparison between two SystemInfo inputs
   */
  async compareSystemInfo(
    info1: SystemInfo,
    info2: SystemInfo,
    hashConfig?: HashGeneratorConfig
  ): Promise<DetailedComparisonResult> {
    const startTime = performance.now();
    const comparisonId = this.generateComparisonId();

    // Generate hashes with debug information
    const debugConfig = { 
      debugMode: this.config.includeDebugInfo,
      ...hashConfig 
    };

    const result1 = await generateIdWithDebug(info1, debugConfig);
    const result2 = await generateIdWithDebug(info2, debugConfig);

    // Find differences in original inputs
    const originalDifferences = this.findObjectDifferences('', info1, info2);

    // Find differences in normalized inputs
    let normalizedDifferences: PropertyDifference[] = [];
    if (result1.debugInfo && result2.debugInfo) {
      normalizedDifferences = this.findObjectDifferences(
        '',
        result1.debugInfo.normalizedInput,
        result2.debugInfo.normalizedInput
      );
    }

    // Analyze impact of differences
    const impactAnalysis = this.analyzeImpact(
      originalDifferences,
      normalizedDifferences,
      result1.hash === result2.hash
    );

    const endTime = performance.now();

    return {
      identical: result1.hash === result2.hash && originalDifferences.length === 0,
      hashesMatch: result1.hash === result2.hash,
      hash1: result1.hash,
      hash2: result2.hash,
      differences: originalDifferences,
      normalizedDifferences,
      impactAnalysis,
      debugInfo1: result1.debugInfo,
      debugInfo2: result2.debugInfo,
      comparisonMetadata: {
        comparisonId,
        timestamp: Date.now(),
        processingTime: endTime - startTime,
        config: debugConfig,
        deepAnalysisEnabled: this.config.enableDeepAnalysis || false
      }
    };
  }

  /**
   * Analyzes hash variations across multiple SystemInfo inputs
   */
  async analyzeHashVariations(
    inputs: SystemInfo[],
    hashConfig?: HashGeneratorConfig
  ): Promise<HashVariationAnalysis> {
    if (inputs.length < 2) {
      throw new Error('At least 2 inputs required for variation analysis');
    }

    // Generate hashes for all inputs
    const results = await Promise.all(
      inputs.map(input => generateIdWithDebug(input, { debugMode: true, ...hashConfig }))
    );

    const inputHashes = results.map(r => r.hash);
    const uniqueHashes = [...new Set(inputHashes)];
    const variationRate = (uniqueHashes.length / inputHashes.length) * 100;

    // Find common differences by comparing all pairs
    const allDifferences: PropertyDifference[] = [];
    for (let i = 0; i < inputs.length - 1; i++) {
      for (let j = i + 1; j < inputs.length; j++) {
        const comparison = await this.compareSystemInfo(inputs[i], inputs[j], hashConfig);
        allDifferences.push(...comparison.differences);
      }
    }

    // Identify most common differences
    const differenceFrequency = new Map<string, PropertyDifference[]>();
    allDifferences.forEach(diff => {
      const key = `${diff.property}:${diff.type}`;
      if (!differenceFrequency.has(key)) {
        differenceFrequency.set(key, []);
      }
      differenceFrequency.get(key)!.push(diff);
    });

    const commonDifferences = Array.from(differenceFrequency.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 10)
      .map(([_, diffs]) => diffs[0]); // Take first occurrence as representative

    // Calculate stability metrics
    const stabilityMetrics = this.calculateStabilityMetrics(inputHashes, uniqueHashes, allDifferences);

    // Generate recommendations
    const recommendations = this.generateVariationRecommendations(
      variationRate,
      commonDifferences,
      stabilityMetrics
    );

    return {
      inputHashes,
      uniqueHashes,
      variationRate,
      commonDifferences,
      stabilityMetrics,
      recommendations
    };
  }

  /**
   * Creates a detailed difference report
   */
  createDifferenceReport(comparison: DetailedComparisonResult): string {
    const lines: string[] = [];

    lines.push('=== Hash Comparison Report ===');
    lines.push(`Comparison ID: ${comparison.comparisonMetadata.comparisonId}`);
    lines.push(`Timestamp: ${new Date(comparison.comparisonMetadata.timestamp).toISOString()}`);
    lines.push(`Processing Time: ${comparison.comparisonMetadata.processingTime.toFixed(2)}ms`);
    lines.push('');

    lines.push('=== Hash Results ===');
    lines.push(`Hash 1: ${comparison.hash1}`);
    lines.push(`Hash 2: ${comparison.hash2}`);
    lines.push(`Hashes Match: ${comparison.hashesMatch ? 'YES' : 'NO'}`);
    lines.push(`Inputs Identical: ${comparison.identical ? 'YES' : 'NO'}`);
    lines.push('');

    lines.push('=== Impact Analysis ===');
    const impact = comparison.impactAnalysis;
    lines.push(`Total Differences: ${impact.totalDifferences}`);
    lines.push(`Critical Differences: ${impact.criticalDifferences}`);
    lines.push(`Hash-Affecting Differences: ${impact.hashAffectingDifferences}`);
    lines.push(`Normalized Away: ${impact.normalizedAwayDifferences}`);
    lines.push(`Stability Score: ${(impact.hashStabilityScore * 100).toFixed(1)}%`);
    lines.push('');

    if (impact.recommendations.length > 0) {
      lines.push('=== Recommendations ===');
      impact.recommendations.forEach(rec => lines.push(`• ${rec}`));
      lines.push('');
    }

    if (comparison.differences.length > 0) {
      lines.push('=== Detailed Differences ===');
      comparison.differences
        .filter(diff => diff.severity !== DifferenceSeverity.NEGLIGIBLE)
        .slice(0, 20) // Limit to top 20 differences
        .forEach(diff => {
          lines.push(`${diff.property} [${diff.severity.toUpperCase()}]:`);
          lines.push(`  Type: ${diff.type}`);
          lines.push(`  Value 1: ${this.formatValue(diff.value1)}`);
          lines.push(`  Value 2: ${this.formatValue(diff.value2)}`);
          lines.push(`  Affects Hash: ${diff.affectsHash ? 'YES' : 'NO'}`);
          lines.push(`  Description: ${diff.description}`);
          lines.push('');
        });
    }

    return lines.join('\n');
  }

  /**
   * Exports comparison result as JSON
   */
  exportComparison(comparison: DetailedComparisonResult): string {
    return JSON.stringify(comparison, null, 2);
  }

  // Private helper methods

  private generateComparisonId(): string {
    return `comp_${Date.now()}_${++this.comparisonCounter}`;
  }

  private findObjectDifferences(
    prefix: string,
    obj1: any,
    obj2: any,
    depth: number = 0
  ): PropertyDifference[] {
    const differences: PropertyDifference[] = [];
    const maxDepth = this.config.maxDifferenceDepth || 10;

    if (depth > maxDepth) {
      return differences;
    }

    // Handle null/undefined cases
    if (obj1 === null || obj1 === undefined || obj2 === null || obj2 === undefined) {
      if (obj1 !== obj2) {
        differences.push(this.createPropertyDifference(prefix, obj1, obj2));
      }
      return differences;
    }

    // Handle primitive types
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
      if (obj1 !== obj2) {
        differences.push(this.createPropertyDifference(prefix, obj1, obj2));
      }
      return differences;
    }

    // Handle arrays
    if (Array.isArray(obj1) || Array.isArray(obj2)) {
      if (Array.isArray(obj1) !== Array.isArray(obj2)) {
        differences.push(this.createPropertyDifference(prefix, obj1, obj2, DifferenceType.TYPE_CHANGE));
      } else if (Array.isArray(obj1) && Array.isArray(obj2)) {
        differences.push(...this.compareArrays(prefix, obj1, obj2, depth));
      }
      return differences;
    }

    // Handle objects
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    const allKeys = new Set([...keys1, ...keys2]);

    for (const key of allKeys) {
      if (this.config.ignoredProperties?.includes(key)) {
        continue;
      }

      const currentPath = prefix ? `${prefix}.${key}` : key;
      const val1 = obj1[key];
      const val2 = obj2[key];

      if (!(key in obj1)) {
        differences.push(this.createPropertyDifference(currentPath, undefined, val2, DifferenceType.ADDED_PROPERTY));
      } else if (!(key in obj2)) {
        differences.push(this.createPropertyDifference(currentPath, val1, undefined, DifferenceType.MISSING_PROPERTY));
      } else {
        differences.push(...this.findObjectDifferences(currentPath, val1, val2, depth + 1));
      }
    }

    return differences;
  }

  private compareArrays(prefix: string, arr1: any[], arr2: any[], depth: number): PropertyDifference[] {
    const differences: PropertyDifference[] = [];

    // Check length difference
    if (arr1.length !== arr2.length) {
      differences.push(this.createPropertyDifference(
        `${prefix}.length`,
        arr1.length,
        arr2.length,
        DifferenceType.ARRAY_LENGTH
      ));
    }

    // Compare elements
    const maxLength = Math.max(arr1.length, arr2.length);
    for (let i = 0; i < maxLength; i++) {
      const val1 = i < arr1.length ? arr1[i] : undefined;
      const val2 = i < arr2.length ? arr2[i] : undefined;

      if (val1 !== val2) {
        differences.push(...this.findObjectDifferences(`${prefix}[${i}]`, val1, val2, depth + 1));
      }
    }

    return differences;
  }

  private createPropertyDifference(
    property: string,
    value1: any,
    value2: any,
    type?: DifferenceType
  ): PropertyDifference {
    const detectedType = type || this.detectDifferenceType(value1, value2);
    const severity = this.calculateSeverity(property, detectedType, value1, value2);
    const affectsHash = this.determineHashImpact(detectedType, severity, value1, value2);

    return {
      property,
      path: property.split('.'),
      value1,
      value2,
      type: detectedType,
      severity,
      affectsHash,
      description: this.generateDifferenceDescription(detectedType, property, value1, value2)
    };
  }

  private detectDifferenceType(value1: any, value2: any): DifferenceType {
    if (typeof value1 !== typeof value2) {
      return DifferenceType.TYPE_CHANGE;
    }

    if (typeof value1 === 'string' && typeof value2 === 'string') {
      if (value1.trim() === value2.trim()) {
        return DifferenceType.WHITESPACE_DIFFERENCE;
      }
      if (value1.normalize() === value2.normalize()) {
        return DifferenceType.ENCODING_DIFFERENCE;
      }
    }

    if (typeof value1 === 'number' && typeof value2 === 'number') {
      if (Math.abs(value1 - value2) < 0.001) {
        return DifferenceType.PRECISION_DIFFERENCE;
      }
    }

    return DifferenceType.VALUE_CHANGE;
  }

  private calculateSeverity(
    property: string,
    type: DifferenceType,
    value1: any,
    value2: any
  ): DifferenceSeverity {
    // Check custom severity rules first
    if (this.config.customSeverityRules?.[property]) {
      return this.config.customSeverityRules[property];
    }

    // Default severity rules based on type
    switch (type) {
      case DifferenceType.WHITESPACE_DIFFERENCE:
      case DifferenceType.ENCODING_DIFFERENCE:
        return DifferenceSeverity.NEGLIGIBLE;
      
      case DifferenceType.PRECISION_DIFFERENCE:
        return DifferenceSeverity.LOW;
      
      case DifferenceType.ARRAY_ORDER:
        return DifferenceSeverity.MEDIUM;
      
      case DifferenceType.TYPE_CHANGE:
      case DifferenceType.MISSING_PROPERTY:
      case DifferenceType.ADDED_PROPERTY:
        return DifferenceSeverity.HIGH;
      
      case DifferenceType.VALUE_CHANGE:
      default:
        // Determine based on property importance
        if (this.isCriticalProperty(property)) {
          return DifferenceSeverity.CRITICAL;
        }
        return DifferenceSeverity.MEDIUM;
    }
  }

  private isCriticalProperty(property: string): boolean {
    const criticalProperties = [
      'userAgent', 'platform', 'screenResolution', 'webGLImageHash',
      'canvasFingerprint', 'audioFingerprint'
    ];
    
    return criticalProperties.some(critical => 
      property.includes(critical) || property.endsWith(critical)
    );
  }

  private determineHashImpact(
    type: DifferenceType,
    severity: DifferenceSeverity,
    value1: any,
    value2: any
  ): boolean {
    // Negligible differences should not affect hash after normalization
    if (severity === DifferenceSeverity.NEGLIGIBLE) {
      return false;
    }

    // Critical and high severity differences usually affect hash
    if (severity === DifferenceSeverity.CRITICAL || severity === DifferenceSeverity.HIGH) {
      return true;
    }

    // For medium and low severity, it depends on the type
    switch (type) {
      case DifferenceType.ARRAY_ORDER:
        return false; // Arrays are sorted during normalization
      
      case DifferenceType.PRECISION_DIFFERENCE:
        return false; // Numbers are rounded during normalization
      
      default:
        return severity !== DifferenceSeverity.LOW;
    }
  }

  private generateDifferenceDescription(
    type: DifferenceType,
    property: string,
    value1: any,
    value2: any
  ): string {
    switch (type) {
      case DifferenceType.VALUE_CHANGE:
        return `Value changed from ${this.formatValue(value1)} to ${this.formatValue(value2)}`;
      
      case DifferenceType.TYPE_CHANGE:
        return `Type changed from ${typeof value1} to ${typeof value2}`;
      
      case DifferenceType.MISSING_PROPERTY:
        return `Property missing in second input`;
      
      case DifferenceType.ADDED_PROPERTY:
        return `Property added in second input`;
      
      case DifferenceType.ARRAY_LENGTH:
        return `Array length changed from ${value1} to ${value2}`;
      
      case DifferenceType.WHITESPACE_DIFFERENCE:
        return `Whitespace differences detected`;
      
      case DifferenceType.ENCODING_DIFFERENCE:
        return `Text encoding differences detected`;
      
      case DifferenceType.PRECISION_DIFFERENCE:
        return `Numeric precision difference: ${Math.abs(value1 - value2).toExponential(2)}`;
      
      default:
        return `Difference detected in ${property}`;
    }
  }

  private analyzeImpact(
    originalDifferences: PropertyDifference[],
    normalizedDifferences: PropertyDifference[],
    hashesMatch: boolean
  ): ImpactAnalysis {
    const totalDifferences = originalDifferences.length;
    const criticalDifferences = originalDifferences.filter(d => d.severity === DifferenceSeverity.CRITICAL).length;
    const hashAffectingDifferences = normalizedDifferences.length;
    const normalizedAwayDifferences = totalDifferences - hashAffectingDifferences;

    // Calculate stability score (0-1, higher is better)
    let stabilityScore = 1.0;
    if (totalDifferences > 0) {
      stabilityScore = Math.max(0, 1 - (hashAffectingDifferences / totalDifferences));
    }
    if (!hashesMatch) {
      stabilityScore *= 0.5; // Penalize if hashes don't match
    }

    // Find most significant differences
    const mostSignificantDifferences = originalDifferences
      .filter(d => d.affectsHash)
      .sort((a, b) => {
        const severityOrder = {
          [DifferenceSeverity.CRITICAL]: 4,
          [DifferenceSeverity.HIGH]: 3,
          [DifferenceSeverity.MEDIUM]: 2,
          [DifferenceSeverity.LOW]: 1,
          [DifferenceSeverity.NEGLIGIBLE]: 0
        };
        return severityOrder[b.severity] - severityOrder[a.severity];
      })
      .slice(0, 5);

    // Generate recommendations
    const recommendations = this.generateImpactRecommendations(
      originalDifferences,
      normalizedDifferences,
      hashesMatch,
      stabilityScore
    );

    return {
      totalDifferences,
      criticalDifferences,
      hashAffectingDifferences,
      normalizedAwayDifferences,
      mostSignificantDifferences,
      hashStabilityScore: stabilityScore,
      recommendations
    };
  }

  private generateImpactRecommendations(
    originalDifferences: PropertyDifference[],
    normalizedDifferences: PropertyDifference[],
    hashesMatch: boolean,
    stabilityScore: number
  ): string[] {
    const recommendations: string[] = [];

    if (!hashesMatch) {
      recommendations.push('Hashes do not match - investigate critical differences');
    }

    if (stabilityScore < 0.7) {
      recommendations.push('Low stability score - consider improving input normalization');
    }

    const criticalDiffs = originalDifferences.filter(d => d.severity === DifferenceSeverity.CRITICAL);
    if (criticalDiffs.length > 0) {
      recommendations.push(`${criticalDiffs.length} critical differences found - review core fingerprint properties`);
    }

    const normalizedAway = originalDifferences.length - normalizedDifferences.length;
    if (normalizedAway > 0) {
      recommendations.push(`${normalizedAway} differences normalized away - normalization is working effectively`);
    }

    if (originalDifferences.some(d => d.type === DifferenceType.PRECISION_DIFFERENCE)) {
      recommendations.push('Numeric precision differences detected - ensure consistent rounding');
    }

    if (originalDifferences.some(d => d.type === DifferenceType.WHITESPACE_DIFFERENCE)) {
      recommendations.push('Whitespace differences detected - ensure consistent string normalization');
    }

    return recommendations;
  }

  private calculateStabilityMetrics(
    inputHashes: string[],
    uniqueHashes: string[],
    allDifferences: PropertyDifference[]
  ): StabilityMetrics {
    const consistency = 1 - (uniqueHashes.length - 1) / (inputHashes.length - 1);
    
    // Calculate entropy (measure of hash distribution)
    const hashCounts = new Map<string, number>();
    inputHashes.forEach(hash => {
      hashCounts.set(hash, (hashCounts.get(hash) || 0) + 1);
    });
    
    let entropy = 0;
    const totalHashes = inputHashes.length;
    hashCounts.forEach(count => {
      const probability = count / totalHashes;
      entropy -= probability * Math.log2(probability);
    });
    
    // Normalize entropy to 0-1 scale
    const maxEntropy = Math.log2(totalHashes);
    const normalizedEntropy = maxEntropy > 0 ? entropy / maxEntropy : 0;

    // Calculate predictability (inverse of variation rate)
    const predictability = consistency;

    // Calculate robustness (resistance to minor changes)
    const minorDifferences = allDifferences.filter(d => 
      d.severity === DifferenceSeverity.LOW || d.severity === DifferenceSeverity.NEGLIGIBLE
    ).length;
    const totalDifferences = allDifferences.length;
    const robustness = totalDifferences > 0 ? 1 - (minorDifferences / totalDifferences) : 1;

    return {
      consistency,
      entropy: normalizedEntropy,
      predictability,
      robustness
    };
  }

  private generateVariationRecommendations(
    variationRate: number,
    commonDifferences: PropertyDifference[],
    metrics: StabilityMetrics
  ): string[] {
    const recommendations: string[] = [];

    if (variationRate > 50) {
      recommendations.push('High variation rate detected - review input consistency');
    }

    if (metrics.consistency < 0.8) {
      recommendations.push('Low consistency - investigate common difference patterns');
    }

    if (commonDifferences.length > 0) {
      const topDiff = commonDifferences[0];
      recommendations.push(`Most common difference: ${topDiff.property} (${topDiff.type})`);
    }

    if (metrics.robustness < 0.7) {
      recommendations.push('Low robustness - minor input changes significantly affect hashes');
    }

    return recommendations;
  }

  private formatValue(value: any): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') {
      return value.length > 50 ? `"${value.substring(0, 47)}..."` : `"${value}"`;
    }
    if (typeof value === 'object') {
      const str = JSON.stringify(value);
      return str.length > 100 ? `${str.substring(0, 97)}...` : str;
    }
    return String(value);
  }
}

/**
 * Global hash comparator instance
 */
let globalComparator: HashComparator | null = null;

/**
 * Gets or creates the global hash comparator instance
 */
export function getHashComparator(config?: Partial<ComparisonConfig>): HashComparator {
  if (!globalComparator) {
    globalComparator = new HashComparator(config);
  }
  return globalComparator;
}

/**
 * Convenience function to compare two SystemInfo inputs
 */
export async function compareSystemInfo(
  info1: SystemInfo,
  info2: SystemInfo,
  config?: HashGeneratorConfig
): Promise<DetailedComparisonResult> {
  const comparator = getHashComparator();
  return await comparator.compareSystemInfo(info1, info2, config);
}

/**
 * Convenience function to analyze hash variations
 */
export async function analyzeHashVariations(
  inputs: SystemInfo[],
  config?: HashGeneratorConfig
): Promise<HashVariationAnalysis> {
  const comparator = getHashComparator();
  return await comparator.analyzeHashVariations(inputs, config);
}
/*
*
 * Troubleshooting utilities for hash variations
 */
export class HashTroubleshooter {
  private comparator: HashComparator;

  constructor(config?: Partial<ComparisonConfig>) {
    this.comparator = new HashComparator(config);
  }

  /**
   * Diagnoses why two SystemInfo inputs produce different hashes
   */
  async diagnoseHashDifference(
    info1: SystemInfo,
    info2: SystemInfo,
    config?: HashGeneratorConfig
  ): Promise<DiagnosisReport> {
    const comparison = await this.comparator.compareSystemInfo(info1, info2, config);
    
    const diagnosis: DiagnosisReport = {
      summary: this.generateDiagnosisSummary(comparison),
      rootCauses: this.identifyRootCauses(comparison),
      fixRecommendations: this.generateFixRecommendations(comparison),
      testCases: this.generateTestCases(comparison),
      comparisonResult: comparison
    };

    return diagnosis;
  }

  /**
   * Identifies properties that are most likely to cause hash instability
   */
  async identifyInstabilityFactors(
    inputs: SystemInfo[],
    config?: HashGeneratorConfig
  ): Promise<InstabilityReport> {
    const variationAnalysis = await this.comparator.analyzeHashVariations(inputs, config);
    
    // Group differences by property to find patterns
    const propertyInstability = new Map<string, PropertyInstability>();
    
    variationAnalysis.commonDifferences.forEach(diff => {
      if (!propertyInstability.has(diff.property)) {
        propertyInstability.set(diff.property, {
          property: diff.property,
          variationCount: 0,
          severityDistribution: {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
            negligible: 0
          },
          commonTypes: new Set(),
          impactScore: 0
        });
      }
      
      const instability = propertyInstability.get(diff.property)!;
      instability.variationCount++;
      instability.severityDistribution[diff.severity]++;
      instability.commonTypes.add(diff.type);
    });

    // Calculate impact scores
    propertyInstability.forEach(instability => {
      const { severityDistribution } = instability;
      instability.impactScore = 
        severityDistribution.critical * 5 +
        severityDistribution.high * 4 +
        severityDistribution.medium * 3 +
        severityDistribution.low * 2 +
        severityDistribution.negligible * 1;
    });

    // Sort by impact score
    const sortedInstabilities = Array.from(propertyInstability.values())
      .sort((a, b) => b.impactScore - a.impactScore);

    return {
      totalInputs: inputs.length,
      uniqueHashes: variationAnalysis.uniqueHashes.length,
      variationRate: variationAnalysis.variationRate,
      topInstabilityFactors: sortedInstabilities.slice(0, 10),
      stabilityMetrics: variationAnalysis.stabilityMetrics,
      recommendations: this.generateInstabilityRecommendations(sortedInstabilities)
    };
  }

  /**
   * Creates a hash stability test suite based on common variation patterns
   */
  generateStabilityTestSuite(
    baselineInput: SystemInfo,
    variationPatterns: VariationPattern[]
  ): StabilityTestSuite {
    const testCases: StabilityTestCase[] = [];

    variationPatterns.forEach((pattern, index) => {
      const testCase: StabilityTestCase = {
        id: `stability_test_${index + 1}`,
        name: pattern.name,
        description: pattern.description,
        baselineInput: { ...baselineInput },
        variations: pattern.variations.map(variation => ({
          name: variation.name,
          input: this.applyVariation(baselineInput, variation),
          expectedStable: variation.shouldBeStable,
          description: variation.description
        })),
        expectedResults: {
          allHashesIdentical: pattern.variations.every(v => v.shouldBeStable),
          maxVariationRate: pattern.maxAllowedVariationRate || 0
        }
      };

      testCases.push(testCase);
    });

    return {
      id: `stability_suite_${Date.now()}`,
      name: 'Hash Stability Test Suite',
      description: 'Automated tests for hash stability across input variations',
      baselineInput,
      testCases,
      metadata: {
        generatedAt: new Date().toISOString(),
        totalTests: testCases.length,
        totalVariations: testCases.reduce((sum, tc) => sum + tc.variations.length, 0)
      }
    };
  }

  /**
   * Runs a stability test suite and generates a report
   */
  async runStabilityTests(
    testSuite: StabilityTestSuite,
    config?: HashGeneratorConfig
  ): Promise<StabilityTestReport> {
    const results: StabilityTestResult[] = [];

    for (const testCase of testSuite.testCases) {
      const baselineHash = await generateIdWithDebug(testCase.baselineInput, config);
      const variationResults: VariationTestResult[] = [];

      for (const variation of testCase.variations) {
        const variationHash = await generateIdWithDebug(variation.input, config);
        const hashesMatch = baselineHash.hash === variationHash.hash;

        variationResults.push({
          variationName: variation.name,
          hashesMatch,
          expectedStable: variation.expectedStable,
          passed: hashesMatch === variation.expectedStable,
          baselineHash: baselineHash.hash,
          variationHash: variationHash.hash,
          comparison: await this.comparator.compareSystemInfo(
            testCase.baselineInput,
            variation.input,
            config
          )
        });
      }

      const allPassed = variationResults.every(vr => vr.passed);
      const variationRate = variationResults.filter(vr => !vr.hashesMatch).length / variationResults.length;

      results.push({
        testCaseId: testCase.id,
        testCaseName: testCase.name,
        passed: allPassed && variationRate <= (testCase.expectedResults.maxVariationRate || 0),
        variationResults,
        summary: {
          totalVariations: variationResults.length,
          stableVariations: variationResults.filter(vr => vr.hashesMatch).length,
          variationRate: variationRate * 100,
          passedExpectations: variationResults.filter(vr => vr.passed).length
        }
      });
    }

    const overallPassed = results.every(r => r.passed);
    const totalTests = results.reduce((sum, r) => sum + r.variationResults.length, 0);
    const passedTests = results.reduce((sum, r) => sum + r.variationResults.filter(vr => vr.passed).length, 0);

    return {
      testSuiteId: testSuite.id,
      testSuiteName: testSuite.name,
      overallPassed,
      results,
      summary: {
        totalTestCases: results.length,
        passedTestCases: results.filter(r => r.passed).length,
        totalVariations: totalTests,
        passedVariations: passedTests,
        overallPassRate: (passedTests / totalTests) * 100
      },
      executedAt: new Date().toISOString()
    };
  }

  // Private helper methods

  private generateDiagnosisSummary(comparison: DetailedComparisonResult): string {
    if (comparison.hashesMatch) {
      return 'Hashes match despite input differences. Normalization is working correctly.';
    }

    const criticalDiffs = comparison.differences.filter(d => d.severity === DifferenceSeverity.CRITICAL);
    if (criticalDiffs.length > 0) {
      return `Hashes differ due to ${criticalDiffs.length} critical difference(s) in core fingerprint properties.`;
    }

    const hashAffecting = comparison.differences.filter(d => d.affectsHash);
    return `Hashes differ due to ${hashAffecting.length} difference(s) that survived normalization.`;
  }

  private identifyRootCauses(comparison: DetailedComparisonResult): RootCause[] {
    const causes: RootCause[] = [];

    // Identify critical property differences
    const criticalDiffs = comparison.differences.filter(d => d.severity === DifferenceSeverity.CRITICAL);
    if (criticalDiffs.length > 0) {
      causes.push({
        category: 'critical_properties',
        description: 'Critical fingerprint properties have different values',
        affectedProperties: criticalDiffs.map(d => d.property),
        severity: 'high',
        likelihood: 0.9
      });
    }

    // Identify normalization failures
    const normalizationFailures = comparison.differences.filter(d => 
      d.affectsHash && (d.severity === DifferenceSeverity.LOW || d.severity === DifferenceSeverity.MEDIUM)
    );
    if (normalizationFailures.length > 0) {
      causes.push({
        category: 'normalization_failure',
        description: 'Some differences were not normalized away as expected',
        affectedProperties: normalizationFailures.map(d => d.property),
        severity: 'medium',
        likelihood: 0.7
      });
    }

    // Identify type inconsistencies
    const typeChanges = comparison.differences.filter(d => d.type === DifferenceType.TYPE_CHANGE);
    if (typeChanges.length > 0) {
      causes.push({
        category: 'type_inconsistency',
        description: 'Data types are inconsistent between inputs',
        affectedProperties: typeChanges.map(d => d.property),
        severity: 'high',
        likelihood: 0.8
      });
    }

    return causes;
  }

  private generateFixRecommendations(comparison: DetailedComparisonResult): FixRecommendation[] {
    const recommendations: FixRecommendation[] = [];

    // Recommendations based on difference types
    const differenceTypes = new Set(comparison.differences.map(d => d.type));

    if (differenceTypes.has(DifferenceType.PRECISION_DIFFERENCE)) {
      recommendations.push({
        priority: 'high',
        category: 'normalization',
        title: 'Improve numeric precision handling',
        description: 'Implement consistent rounding for floating-point numbers',
        implementation: 'Use reliableRound() function with consistent precision (3 decimal places)',
        estimatedImpact: 'high'
      });
    }

    if (differenceTypes.has(DifferenceType.WHITESPACE_DIFFERENCE)) {
      recommendations.push({
        priority: 'medium',
        category: 'normalization',
        title: 'Enhance string normalization',
        description: 'Improve whitespace and encoding normalization',
        implementation: 'Use normalizeStringValue() function consistently',
        estimatedImpact: 'medium'
      });
    }

    if (differenceTypes.has(DifferenceType.ARRAY_ORDER)) {
      recommendations.push({
        priority: 'medium',
        category: 'normalization',
        title: 'Implement deterministic array sorting',
        description: 'Ensure arrays are sorted consistently',
        implementation: 'Use normalizeArrayValue() function for all array properties',
        estimatedImpact: 'high'
      });
    }

    return recommendations;
  }

  private generateTestCases(comparison: DetailedComparisonResult): TestCase[] {
    const testCases: TestCase[] = [];

    // Generate test cases for each significant difference
    comparison.impactAnalysis.mostSignificantDifferences.forEach((diff, index) => {
      testCases.push({
        id: `test_${index + 1}`,
        name: `Test ${diff.property} stability`,
        description: `Verify that ${diff.type} in ${diff.property} is handled correctly`,
        input1: { [diff.property]: diff.value1 },
        input2: { [diff.property]: diff.value2 },
        expectedResult: diff.affectsHash ? 'different_hashes' : 'same_hashes',
        category: 'regression'
      });
    });

    return testCases;
  }

  private generateInstabilityRecommendations(instabilities: PropertyInstability[]): string[] {
    const recommendations: string[] = [];

    if (instabilities.length === 0) {
      recommendations.push('No significant instability factors detected');
      return recommendations;
    }

    const topInstability = instabilities[0];
    recommendations.push(`Focus on stabilizing '${topInstability.property}' - highest impact factor`);

    const highImpactCount = instabilities.filter(i => i.impactScore >= 15).length;
    if (highImpactCount > 3) {
      recommendations.push(`${highImpactCount} properties have high instability - consider systematic review`);
    }

    const criticalCount = instabilities.reduce((sum, i) => sum + i.severityDistribution.critical, 0);
    if (criticalCount > 0) {
      recommendations.push(`${criticalCount} critical variations detected - immediate attention required`);
    }

    return recommendations;
  }

  private applyVariation(baseInput: SystemInfo, variation: InputVariation): SystemInfo {
    const modified = JSON.parse(JSON.stringify(baseInput)); // Deep clone

    variation.modifications.forEach(mod => {
      this.setNestedProperty(modified, mod.property, mod.newValue);
    });

    return modified;
  }

  private setNestedProperty(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
  }
}

// Additional interfaces for troubleshooting

export interface DiagnosisReport {
  summary: string;
  rootCauses: RootCause[];
  fixRecommendations: FixRecommendation[];
  testCases: TestCase[];
  comparisonResult: DetailedComparisonResult;
}

export interface RootCause {
  category: string;
  description: string;
  affectedProperties: string[];
  severity: 'low' | 'medium' | 'high';
  likelihood: number; // 0-1
}

export interface FixRecommendation {
  priority: 'low' | 'medium' | 'high';
  category: string;
  title: string;
  description: string;
  implementation: string;
  estimatedImpact: 'low' | 'medium' | 'high';
}

export interface TestCase {
  id: string;
  name: string;
  description: string;
  input1: Partial<SystemInfo>;
  input2: Partial<SystemInfo>;
  expectedResult: 'same_hashes' | 'different_hashes';
  category: 'regression' | 'stability' | 'normalization';
}

export interface InstabilityReport {
  totalInputs: number;
  uniqueHashes: number;
  variationRate: number;
  topInstabilityFactors: PropertyInstability[];
  stabilityMetrics: StabilityMetrics;
  recommendations: string[];
}

export interface PropertyInstability {
  property: string;
  variationCount: number;
  severityDistribution: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    negligible: number;
  };
  commonTypes: Set<DifferenceType>;
  impactScore: number;
}

export interface VariationPattern {
  name: string;
  description: string;
  variations: InputVariation[];
  maxAllowedVariationRate?: number;
}

export interface InputVariation {
  name: string;
  description: string;
  shouldBeStable: boolean;
  modifications: PropertyModification[];
}

export interface PropertyModification {
  property: string;
  newValue: any;
  reason: string;
}

export interface StabilityTestSuite {
  id: string;
  name: string;
  description: string;
  baselineInput: SystemInfo;
  testCases: StabilityTestCase[];
  metadata: {
    generatedAt: string;
    totalTests: number;
    totalVariations: number;
  };
}

export interface StabilityTestCase {
  id: string;
  name: string;
  description: string;
  baselineInput: SystemInfo;
  variations: {
    name: string;
    input: SystemInfo;
    expectedStable: boolean;
    description: string;
  }[];
  expectedResults: {
    allHashesIdentical: boolean;
    maxVariationRate: number;
  };
}

export interface StabilityTestReport {
  testSuiteId: string;
  testSuiteName: string;
  overallPassed: boolean;
  results: StabilityTestResult[];
  summary: {
    totalTestCases: number;
    passedTestCases: number;
    totalVariations: number;
    passedVariations: number;
    overallPassRate: number;
  };
  executedAt: string;
}

export interface StabilityTestResult {
  testCaseId: string;
  testCaseName: string;
  passed: boolean;
  variationResults: VariationTestResult[];
  summary: {
    totalVariations: number;
    stableVariations: number;
    variationRate: number;
    passedExpectations: number;
  };
}

export interface VariationTestResult {
  variationName: string;
  hashesMatch: boolean;
  expectedStable: boolean;
  passed: boolean;
  baselineHash: string;
  variationHash: string;
  comparison: DetailedComparisonResult;
}

/**
 * Global troubleshooter instance
 */
let globalTroubleshooter: HashTroubleshooter | null = null;

/**
 * Gets or creates the global hash troubleshooter instance
 */
export function getHashTroubleshooter(config?: Partial<ComparisonConfig>): HashTroubleshooter {
  if (!globalTroubleshooter) {
    globalTroubleshooter = new HashTroubleshooter(config);
  }
  return globalTroubleshooter;
}

/**
 * Convenience function to diagnose hash differences
 */
export async function diagnoseHashDifference(
  info1: SystemInfo,
  info2: SystemInfo,
  config?: HashGeneratorConfig
): Promise<DiagnosisReport> {
  const troubleshooter = getHashTroubleshooter();
  return await troubleshooter.diagnoseHashDifference(info1, info2, config);
}