import { afterEach, describe, expect, it, vi } from "vitest";
import { apiGet } from "./client";
import { ApiError } from "./errors";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("apiGet", () => {
  it("refuses paths outside /api/v1/", async () => {
    await expect(apiGet("/evil")).rejects.toMatchObject({
      message: "Refusing to request an unexpected path",
      retryable: false,
    });
  });

  it("sends a cookie-less GET and returns JSON", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiGet("/api/v1/products")).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/products",
      expect.objectContaining({
        method: "GET",
        credentials: "omit",
        referrerPolicy: "no-referrer",
      }),
    );
  });

  it("marks 4xx as not retryable and 5xx as retryable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 404, json: async () => ({}) }),
    );
    await expect(apiGet("/api/v1/products/1")).rejects.toEqual(
      expect.objectContaining({ status: 404, retryable: false }),
    );

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 503, json: async () => ({}) }),
    );
    await expect(apiGet("/api/v1/products")).rejects.toBeInstanceOf(ApiError);
    await expect(apiGet("/api/v1/products")).rejects.toMatchObject({
      status: 503,
      retryable: true,
    });
  });

  it("uses a 2s cool-down when 429 has no Retry-After", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        headers: new Headers(),
        json: async () => ({}),
      }),
    );
    await expect(apiGet("/api/v1/products")).rejects.toMatchObject({
      status: 429,
      retryable: true,
      retryAfterMs: 2_000,
    });
  });

  it("keeps 429 retryable and honors Retry-After", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        headers: new Headers({ "Retry-After": "8" }),
        json: async () => ({}),
      }),
    );
    await expect(apiGet("/api/v1/products")).rejects.toMatchObject({
      status: 429,
      retryable: true,
      retryAfterMs: 8_000,
    });
  });
});
