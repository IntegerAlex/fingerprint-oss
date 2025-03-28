/**
 * Generate a Hash from the system info to identify the user
 * @param systemInfo 
 * @returns hash string
 */
import { sha256 } from 'hash-wasm';
import { SystemInfo } from './types';

export async function generateId(systemInfo: SystemInfo): Promise<string> {
  // Get the sorted keys (as strings)
  const sortedKeys = Object.keys(systemInfo).sort();

  // Create a new object with sorted keys.
  // We use Record<string, any> so that we don't need to change SystemInfo elsewhere.
  const sortedSystemInfo: Record<string, any> = {};

  for (const key of sortedKeys) {
    // Use a type assertion for the key to access systemInfo safely.
    sortedSystemInfo[key] = systemInfo[key as keyof SystemInfo];
  }

  // JSON.stringify with a replacer function to handle special values.
  const hashInput = JSON.stringify(sortedSystemInfo, (key, value) => {
    if (value === undefined) return 'undefined';
    if (value === Infinity) return 'Infinity';
    if (Number.isNaN(value)) return 'NaN';
    return value;
  });

  return await sha256(hashInput);
}

