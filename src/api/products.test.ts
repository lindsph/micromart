import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "./errors";
import { fetchCategories, fetchHealth, fetchProduct, fetchProductList } from "./products";

afterEach(() => {
  vi.unstubAllGlobals();
});

function jsonOk(body: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => body,
    }),
  );
}

describe("fetchProductList", () => {
  it("parses a list page and drops junk rows", async () => {
    jsonOk({
      data: [{ id: 1, name: "Coke Zero", price: 2.5 }, { name: "Nope" }],
      total: 9,
      page: 1,
      limit: 20,
      nextCursor: "next",
    });
    const list = await fetchProductList({ search: "zero", limit: 20 });
    expect(list.data).toHaveLength(1);
    expect(list.data[0]?.name).toBe("Coke Zero");
    expect(list.total).toBe(9);
    expect(list.nextCursor).toBe("next");
  });
});

describe("fetchHealth", () => {
  it("accepts { status: ok }", async () => {
    jsonOk({ status: "ok" });
    await expect(fetchHealth()).resolves.toEqual({ status: "ok" });
  });

  it("rejects any other payload", async () => {
    jsonOk({ status: "down" });
    await expect(fetchHealth()).rejects.toMatchObject({
      message: "Health response was not valid",
      retryable: false,
    });
  });
});

describe("fetchCategories", () => {
  it("keeps string names", async () => {
    jsonOk(["Drink", "Snack", 9]);
    await expect(fetchCategories()).resolves.toEqual(["Drink", "Snack"]);
  });

  it("throws when the payload is not a list", async () => {
    jsonOk({ categories: ["Drink"] });
    await expect(fetchCategories()).rejects.toBeInstanceOf(ApiError);
    await expect(fetchCategories()).rejects.toMatchObject({
      message: "Categories response was not valid",
      retryable: false,
    });
  });
});

describe("fetchProduct", () => {
  it("returns a parsed SKU", async () => {
    jsonOk({ id: 12, name: "Coke Zero", price: 2.5, stock: 8 });
    await expect(fetchProduct(12)).resolves.toMatchObject({
      id: 12,
      name: "Coke Zero",
      price: 2.5,
      stock: 8,
    });
  });

  it("rejects a payload without an id", async () => {
    jsonOk({ name: "Coke Zero" });
    await expect(fetchProduct(12)).rejects.toThrow("Product response was not valid");
  });
});
