/*!
 * Lightweight structured errors for fingerprint-oss.
 */

export type FingerprintErrorCode =
    | 'GEO_TIMEOUT'
    | 'GEO_FAILED'
    | 'CONFIG_INVALID'
    | 'SYSTEM_INFO_FAILED'
    | 'HASH_FAILED'
    | 'UNKNOWN';

export class FingerprintError extends Error {
    public readonly code: FingerprintErrorCode;
    public readonly details?: unknown;
    public readonly cause?: unknown;

    constructor(code: FingerprintErrorCode, message: string, options?: { details?: unknown; cause?: unknown }) {
        super(message);
        this.name = 'FingerprintError';
        this.code = code;
        this.details = options?.details;
        this.cause = options?.cause;
    }
}

export function toFingerprintError(
    error: unknown,
    fallbackCode: FingerprintErrorCode = 'UNKNOWN',
    fallbackMessage = 'Fingerprint operation failed'
): FingerprintError {
    if (error instanceof FingerprintError) return error;
    if (error instanceof Error) {
        return new FingerprintError(fallbackCode, error.message || fallbackMessage, { cause: error });
    }
    return new FingerprintError(fallbackCode, fallbackMessage, { details: error });
}
