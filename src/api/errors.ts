export const DEFAULT_RATE_LIMIT_MS = 2_000;
export const MAX_RETRY_AFTER_MS = 60_000;

export class ApiError extends Error {
  readonly status?: number;
  readonly retryable: boolean;
  readonly retryAfterMs?: number;

  constructor(
    message: string,
    status?: number,
    retryable = true,
    retryAfterMs?: number,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.retryable = retryable;
    this.retryAfterMs = retryAfterMs;
  }
}

export function isRetryableError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.retryable;
  }
  return true;
}

export function isRateLimitError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 429;
}

/** Retry-After is seconds or an HTTP date. Missing header waits 2s, not 200ms. */
export function parseRetryAfterMs(header: string | null | undefined): number {
  if (header == null || header.trim() === "") {
    return DEFAULT_RATE_LIMIT_MS;
  }
  const seconds = Number(header);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.min(seconds * 1000, MAX_RETRY_AFTER_MS);
  }
  const at = Date.parse(header);
  if (!Number.isNaN(at)) {
    return Math.min(Math.max(0, at - Date.now()), MAX_RETRY_AFTER_MS);
  }
  return DEFAULT_RATE_LIMIT_MS;
}

export function queryRetryDelay(attempt: number, error: unknown): number {
  if (isRateLimitError(error) && error instanceof ApiError) {
    return error.retryAfterMs ?? DEFAULT_RATE_LIMIT_MS;
  }
  return Math.min(200 * 2 ** attempt, 800);
}
