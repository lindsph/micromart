import { ApiError, parseRetryAfterMs } from "./errors";

const API_ORIGIN = "https://micromart-frontend-takehome.up.railway.app";
const ALLOWED_PREFIX = "/api/v1/";
/** Fail fast so a hung request can retry instead of sitting for 10s. */
const REQUEST_TIMEOUT_MS = 3_500;

export const API_BASE = import.meta.env.DEV ? "" : API_ORIGIN;

export async function apiGet<T>(
  path: string,
  signal?: AbortSignal,
): Promise<T> {
  if (!path.startsWith(ALLOWED_PREFIX)) {
    throw new ApiError("Refusing to request an unexpected path", undefined, false);
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort);

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method: "GET",
      signal: controller.signal,
      credentials: "omit",
      referrerPolicy: "no-referrer",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      const retryable = response.status >= 500 || response.status === 429;
      const retryAfterMs =
        response.status === 429
          ? parseRetryAfterMs(response.headers?.get("Retry-After"))
          : undefined;
      throw new ApiError(
        `Request failed (${response.status})`,
        response.status,
        retryable,
        retryAfterMs,
      );
    }

    const body: unknown = await response.json();
    return body as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof DOMException && error.name === "AbortError") {
      // React Query cancelled this on purpose — do not treat it as a failure.
      if (signal?.aborted) {
        throw error;
      }
      throw new ApiError("Request timed out", undefined, true);
    }
    throw new ApiError("Network request failed", undefined, true);
  } finally {
    window.clearTimeout(timeout);
    signal?.removeEventListener("abort", onAbort);
  }
}
