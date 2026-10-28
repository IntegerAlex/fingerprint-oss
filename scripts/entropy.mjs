/**
 * Fingerprint stability + per-component entropy report.
 *
 * Input: JSON produced by test/e2e/cypress/e2e/unit/entropy.cy.js — an array of
 * samples, where each sample is a flat map of component name -> string value.
 *
 * For each component it reports:
 *   - entropy: Shannon entropy in bits across the observed values
 *   - stability: share of samples that agree with the most common value
 *   - distinct: number of distinct values seen
 *
 * These are per-machine measurements. They say nothing about uniqueness across
 * a population — that needs a population sample, which we do not have.
 *
 * Usage: node scripts/entropy.mjs <samples.json>
 *        node scripts/entropy.mjs --self-check
 */
import { readFileSync } from 'node:fs';

export function shannon(values) {
  if (values.length === 0) return 0;
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  let bits = 0;
  for (const count of counts.values()) {
    const p = count / values.length;
    bits -= p * Math.log2(p);
  }
  return bits;
}

export function stability(values) {
  if (values.length === 0) return 0;
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return Math.max(...counts.values()) / values.length;
}

export function summarize(samples) {
  const components = new Set();
  for (const sample of samples) for (const key of Object.keys(sample)) components.add(key);

  return [...components].sort().map(name => {
    const values = samples.map(sample => String(sample[name] ?? '<missing>'));
    return {
      name,
      entropy: shannon(values),
      stability: stability(values),
      distinct: new Set(values).size,
    };
  });
}

export function formatTable(rows) {
  const lines = [
    '| Component | Entropy (bits) | Stability | Distinct |',
    '|---|---:|---:|---:|',
    ...rows.map(r => `| ${r.name} | ${r.entropy.toFixed(2)} | ${(r.stability * 100).toFixed(0)}% | ${r.distinct} |`),
  ];
  return lines.join('\n');
}

function selfCheck() {
  const eq = (actual, expected, label) => {
    const ok = Math.abs(actual - expected) < 1e-9;
    if (!ok) throw new Error(`${label}: expected ${expected}, got ${actual}`);
    console.log(`ok  ${label}`);
  };

  eq(shannon(['a', 'a', 'a']), 0, 'identical values carry no entropy');
  eq(shannon(['a', 'b']), 1, 'two equiprobable values = 1 bit');
  eq(shannon(['a', 'b', 'c', 'd']), 2, 'four equiprobable values = 2 bits');
  eq(stability(['a', 'a', 'b']), 2 / 3, 'stability is the modal share');

  const rows = summarize([
    { canvas: 'x', tz: 'UTC' },
    { canvas: 'x', tz: 'UTC' },
    { canvas: 'y', tz: 'UTC' },
  ]);
  const canvas = rows.find(r => r.name === 'canvas');
  const tz = rows.find(r => r.name === 'tz');
  eq(canvas.distinct, 2, 'distinct counts values');
  eq(tz.entropy, 0, 'stable component has zero entropy');
  eq(canvas.stability, 2 / 3, 'canvas modal share');

  console.log('\nself-check passed');
}

const [, , input] = process.argv;

if (input === '--self-check') {
  selfCheck();
} else if (!input) {
  console.error('usage: node scripts/entropy.mjs <samples.json> | --self-check');
  process.exit(1);
} else {
  const samples = JSON.parse(readFileSync(input, 'utf8'));
  if (!Array.isArray(samples) || samples.length === 0) {
    console.error(`${input}: expected a non-empty array of samples`);
    process.exit(1);
  }
  console.log(`# Fingerprint report — ${samples.length} samples\n`);
  console.log(formatTable(summarize(samples)));
  console.log('\nEntropy is per-machine (Shannon, bits). Stability is the share of samples');
  console.log('agreeing with the modal value. Neither is a population uniqueness figure.');
}
