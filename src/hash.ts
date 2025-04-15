/**
 * Generates a SHA-256 hash from sorted system info for identification.
 * @param systemInfo Object containing system-specific data.
 * @returns A SHA-256 hash string.
 */
import { sha256 } from 'hash-wasm';
import { SystemInfo } from './types';

export async function generateId(systemInfo: SystemInfo): Promise<string> {
  const keys = Object.keys(systemInfo).sort();

  if (keys.length === 0) return await sha256(''); // Early return for empty input

  const sortedInfo: Record<string, unknown> = {};

  for (const key of keys) {
    sortedInfo[key] = systemInfo[key as keyof SystemInfo];
  }

  // Serialize with normalization for undefined, Infinity, NaN
  const json = JSON.stringify(sortedInfo, (_key, value) => {
    if (value === undefined) return 'undefined';
    if (value === Infinity) return 'Infinity';
    if (Number.isNaN(value)) return 'NaN';
    return value;
  });

  return await sha256(json);
}

