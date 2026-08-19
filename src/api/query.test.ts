import { describe, expect, it } from "vitest";
import { makeProduct } from "../test/factories";
import {
  categoriesPath,
  healthPath,
  nextListPageParam,
  productDetailPath,
  productListPath,
} from "./query";

describe("productListPath", () => {
  it("omits empty search and page 1", () => {
    expect(productListPath()).toBe("/api/v1/products");
    expect(productListPath({ page: 1, search: "   " })).toBe("/api/v1/products");
  });

  it("sends brand and category as query params", () => {
    const path = productListPath({
      brand: "Coca-Cola",
      category: "Drink",
      limit: 20,
    });
    expect(path).toContain("brand=Coca-Cola");
    expect(path).toContain("category=Drink");
    expect(path).toContain("limit=20");
  });

  it("encodes search and joins tags", () => {
    const path = productListPath({
      search: "coke & zero",
      tags: ["Soda", "Zero Sugar"],
      page: 2,
      limit: 20,
      sort: "name",
      order: "asc",
    });
    expect(path).toContain("/api/v1/products?");
    expect(path).toContain("search=coke+%26+zero");
    expect(path).toContain("tags=Soda%2CZero+Sugar");
    expect(path).toContain("page=2");
    expect(path).toContain("limit=20");
  });

  it("caps limit at the API max", () => {
    expect(productListPath({ limit: 500 })).toContain("limit=100");
    expect(productListPath({ limit: 0 })).toContain("limit=1");
  });

  it("prefers cursor over page", () => {
    const path = productListPath({ cursor: "next-1", page: 3 });
    expect(path).toContain("cursor=next-1");
    expect(path).not.toContain("page=");
  });
});

describe("nextListPageParam", () => {
  it("returns the API cursor when one is present", () => {
    expect(
      nextListPageParam({
        data: [makeProduct()],
        total: 40,
        page: 1,
        limit: 20,
        nextCursor: "abc",
      }),
    ).toEqual({ cursor: "abc" });
  });

  it("falls back to the next page when there is no cursor and total says more", () => {
    expect(
      nextListPageParam({
        data: [makeProduct()],
        total: 40,
        page: 1,
        limit: 20,
      }),
    ).toEqual({ page: 2 });
  });

  it("stops when the cursor is gone and the page is the last", () => {
    expect(
      nextListPageParam({
        data: [makeProduct()],
        total: 20,
        page: 1,
        limit: 20,
      }),
    ).toBeUndefined();
    expect(
      nextListPageParam({
        data: [],
        total: 40,
        page: 2,
        limit: 20,
      }),
    ).toBeUndefined();
  });
});

describe("productDetailPath", () => {
  it("builds a detail path and rejects bad ids", () => {
    expect(productDetailPath(99999)).toBe("/api/v1/products/99999");
    expect(() => productDetailPath(0)).toThrow("Invalid product id");
    expect(() => productDetailPath(1.5)).toThrow("Invalid product id");
  });
});

describe("categoriesPath", () => {
  it("hits the allowlisted categories route", () => {
    expect(categoriesPath()).toBe("/api/v1/categories");
  });
});

describe("healthPath", () => {
  it("hits the public health check", () => {
    expect(healthPath()).toBe("/health");
  });
});
