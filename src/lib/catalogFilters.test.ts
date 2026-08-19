import { describe, expect, it } from "vitest";
import { FEATURED_BRANDS, liveListSearch, sortParams } from "./catalogFilters";

describe("sortParams", () => {
  it("maps operator sort chips to API fields", () => {
    expect(sortParams("name-asc")).toEqual({ sort: "name", order: "asc" });
    expect(sortParams("name-desc")).toEqual({ sort: "name", order: "desc" });
    expect(sortParams("price-asc")).toEqual({ sort: "price", order: "asc" });
    expect(sortParams("price-desc")).toEqual({ sort: "price", order: "desc" });
    expect(sortParams("stock-asc")).toEqual({ sort: "stock", order: "asc" });
    expect(sortParams("newest")).toEqual({ sort: "createdAt", order: "desc" });
  });
});

describe("FEATURED_BRANDS", () => {
  it("is a short allowlist, not the full catalog", () => {
    expect(FEATURED_BRANDS.length).toBeLessThan(12);
    expect(FEATURED_BRANDS).toContain("Coca-Cola");
    expect(FEATURED_BRANDS).toContain("Fairlife");
  });
});

describe("liveListSearch", () => {
  it("clears the list query immediately when the box is empty", () => {
    expect(liveListSearch("", "coke")).toBe("");
    expect(liveListSearch("   ", "coke")).toBe("");
  });

  it("uses the debounced term while typing", () => {
    expect(liveListSearch("coke", "co")).toBe("co");
    expect(liveListSearch("coke", "coke")).toBe("coke");
    expect(liveListSearch("  coke  ", "  coke  ")).toBe("coke");
  });
});
