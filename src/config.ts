/**
 * Configuration module for fingerprint-oss
 */

export interface Config {
  env: 'TEST' | 'PROD';
  verbose: boolean;
}

const defaultConfig: Config = {
  env: 'PROD',
  verbose: false
};

let currentConfig = { ...defaultConfig };

export function setConfig(config: Partial<Config>) {
  currentConfig = {
    ...defaultConfig,
    ...config
  };
}

export function getConfig(): Config {
  return currentConfig;
}

export function isTestEnv(): boolean {
  return currentConfig.env === 'TEST';
}

export function isVerboseLogging(): boolean {
  return currentConfig.verbose || isTestEnv();
}

// Logger utility
export const logger = {
  log: (...args: any[]) => {
    if (isVerboseLogging()) {
      console.log('[fingerprint-oss]', ...args);
    }
  },
  warn: (...args: any[]) => {
    if (isVerboseLogging()) {
      console.warn('[fingerprint-oss]', ...args);
    }
  },
  error: (...args: any[]) => {
    // Always log errors, but with more detail in TEST
    if (isVerboseLogging()) {
      console.error('[fingerprint-oss]', ...args);
    } else {
      console.error('[fingerprint-oss]', args[0]);
    }
  }
};