/*!
 * Structured error definitions for Fingerprint OSS
 * Copyright (c) 2025 Akshat Kotpalliwar
 * Licensed under LGPL-3.0
 */

export type FingerprintErrorCode =
    | 'CONFIG_INVALID'
    | 'GEO_TIMEOUT'
    | 'GEO_HTTP_ERROR'
    | 'GEO_INVALID_RESPONSE'
    | 'GEO_FETCH_FAILED'
    | 'PRESET_UNAVAILABLE'
    | 'UNKNOWN_ERROR';

export interface FingerprintWarning {
    code: FingerprintErrorCode;
    message: string;
    details?: Record<string, unknown>;
}

export class FingerprintError extends Error {
    code: FingerprintErrorCode;
    details?: Record<string, unknown>;

    constructor(code: FingerprintErrorCode, message: string, details?: Record<string, unknown>) {
        super(message);
        this.name = 'FingerprintError';
        this.code = code;
        this.details = details;
    }

    toJSON() {
        return {
            code: this.code,
            message: this.message,
            ...(this.details ? { details: this.details } : {})
        };
    }
}
