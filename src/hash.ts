import { SystemInfo } from './types';
import { sha256 } from 'hash-wasm';

export async function generateId(systemInfo: SystemInfo): Promise<string> {
  const stableInfo = {
    // Core browser identity properties
    userAgent: systemInfo.userAgent,
    platform: systemInfo.platform,
    
    // Language and regional settings
    languages: systemInfo.languages,
    timezone: systemInfo.timezone,
    
    // Graphics capabilities (normalized)
    screenResolution: systemInfo.screenResolution,
    colorDepth: systemInfo.colorDepth,
    colorGamut: systemInfo.colorGamut,
    
    // Platform fundamentals
    os: systemInfo.os,
    
    // Hardware fingerprint (normalized)
    gpuVendor: systemInfo.webGL?.vendor.replace(/\(.*?\)/g, '').trim(),
    gpuRenderer: systemInfo.webGL?.renderer.replace(/(0x[\da-f]+)|(D3D\d+)|(vs_.*?ps_.*)/gi, '').trim(),
    
    // Privacy-neutral font metrics
    fontMetrics: systemInfo.fontPreferences.fonts.map(f => ({
      name: f.name,
      width: Math.round(f.width / 10) * 10 // Round to nearest 10
    })),
   // Fixed mathConstants section
mathConstants: Object.fromEntries(
  Object.entries(systemInfo.mathConstants).map(([k, v]) => [
    k, 
    Number(Number(v).toFixed(3))  // Explicit conversion and fixed decimal places
  ])  // Added closing bracket for map
),  // Comma added for object separation

// Fixed plugins section
plugins: systemInfo.plugins
  .filter(p => !p.name?.includes('Brave'))
  .map(p => ({
    name: p.name?.replace(/\s+/g, ' ').trim() || '',
    types: p.mimeTypes?.map(mt => mt.type) || []
  })) 
  };
  const sortedStableInfo = deepSortObject(stableInfo);
  const hashInput = JSON.stringify(sortedStableInfo, replacer);
  return await sha256(hashInput);
}

// Additional normalization in replacer
function replacer(key: string, value: any) {
  if (value instanceof ArrayBuffer) return '';
  if (typeof value === 'number') return Number(value.toFixed(3));
  if (typeof value === 'string') return value.replace(/\s+/g, ' ').trim();
  return value;
}

function deepSortObject(obj: Record<string, any>): any {
  if (Array.isArray(obj)) {
    return obj
      .map(deepSortObject)
      .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  }
  
  if (obj && typeof obj === 'object') {
    return Object.keys(obj)
      .sort()
      .reduce((acc, key) => {
        acc[key] = deepSortObject(obj[key]);
        return acc;
      }, {} as Record<string, any>);
  }
  
  return obj;
}
