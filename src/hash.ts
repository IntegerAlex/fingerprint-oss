/**
 * Generate a Hash from the system info to identify the user
 * @param systemInfo 
 * @returns hash string
 */
import {sha256} from 'hash-wasm';
import { SystemInfo } from './types';
export async function generateId(systemInfo:SystemInfo):Promise<string>{
 	// Generate a hash from the system info to identify the user 
	// The hash is generated using a stable JSON serialization to ensure consistency
	const hashInput = JSON.stringify(systemInfo, Object.keys(systemInfo).sort(), (key, value) => {
    if (value === undefined) return 'undefined';
    if (value === Infinity) return 'Infinity';
    if (Number.isNaN(value)) return 'NaN';
    return value;
  });
  	return await sha256(hashInput);	
}

