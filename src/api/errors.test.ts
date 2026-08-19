import { describe, expect, it, vi } from "vitest";
import {
  ApiError,
  DEFAULT_RATE_LIMIT_MS,
  isRateLimitError,
  isRetryableError,
  parseRetryAfterMs,
  queryRetryDelay,
} from "./errors";

describe("isRetryableError", () => {
  it("does not retry 4xx catalog errors", () => {
    expect(isRetryableError(new ApiError("Nope", 404, false))).toBe(false);
  });

  it("retries timeouts and unknown failures", () => {
    expect(isRetryableError(new ApiError("Timed out", undefined, true))).toBe(true);
    expect(isRetryableError(new Error("offline"))).toBe(true);
  });
});

describe("rate limits", () => {
  it("treats 429 as a rate limit", () => {
    expect(isRateLimitError(new ApiError("Busy", 429, true, 5_000))).toBe(true);
    expect(isRateLimitError(new ApiError("Down", 503, true))).toBe(false);
  });

  it("reads Retry-After as seconds and defaults to 2s", () => {
    expect(parseRetryAfterMs("5")).toBe(5_000);
    expect(parseRetryAfterMs(null)).toBe(DEFAULT_RATE_LIMIT_MS);
    expect(parseRetryAfterMs("nope")).toBe(DEFAULT_RATE_LIMIT_MS);
  });

  it("reads Retry-After as an HTTP date", () => {
    const now = 1_700_000_000_000;
    vi.spyOn(Date, "now").mockReturnValue(now);
    const when = new Date(now + 4_000).toUTCString();
    expect(parseRetryAfterMs(when)).toBe(4_000);
    vi.restoreAllMocks();
  });

  it("waits Retry-After on 429 instead of 200ms", () => {
    const busy = new ApiError("Busy", 429, true, 5_000);
    expect(queryRetryDelay(0, busy)).toBe(5_000);
    expect(queryRetryDelay(0, new ApiError("Down", 503, true))).toBe(200);
    expect(queryRetryDelay(2, new Error("offline"))).toBe(800);
  });
});
