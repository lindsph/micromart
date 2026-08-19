import { describe, expect, it } from "vitest";
import { parseProduct, parseProductList } from "./parseProduct";

describe("parseProduct", () => {
  it("returns null without a numeric id", () => {
    expect(parseProduct(null)).toBeNull();
    expect(parseProduct({ name: "Coke" })).toBeNull();
    expect(parseProduct({ id: "1" })).toBeNull();
  });

  it("keeps a planted draft and does not invent money or stock", () => {
    const product = parseProduct({ id: 99999, status: "draft" });
    expect(product).toMatchObject({
      id: 99999,
      name: "",
      brand: "",
      imageUrl: "",
      price: null,
      cost: null,
      stock: null,
      status: "draft",
      tags: [],
      size: { value: 0, unit: "" },
    });
  });

  it("does not treat a hole as a finalized $0 SKU", () => {
    expect(parseProduct({ id: 1 })).toMatchObject({
      id: 1,
      name: "",
      price: null,
      cost: null,
      stock: null,
      status: "",
    });
  });

  it("keeps an explicit zero price and stock", () => {
    expect(parseProduct({ id: 1, price: 0, stock: 0, status: "finalized" })).toMatchObject({
      id: 1,
      price: 0,
      stock: 0,
      status: "finalized",
    });
  });

  it("keeps a well-formed catalog row", () => {
    const product = parseProduct({
      id: 12,
      name: "Coke Zero",
      brand: "Coca-Cola",
      price: 2.5,
      stock: 8,
      category: "Drink",
      status: "finalized",
      tags: ["Soda", 9],
      size: { value: 12, unit: "oz" },
    });
    expect(product).toMatchObject({
      id: 12,
      name: "Coke Zero",
      brand: "Coca-Cola",
      price: 2.5,
      stock: 8,
      tags: ["Soda"],
      size: { value: 12, unit: "oz" },
      status: "finalized",
    });
  });
});

describe("parseProductList", () => {
  it("drops malformed rows and keeps pagination", () => {
    const list = parseProductList({
      data: [{ id: 1, name: "Ok" }, { name: "Nope" }, null],
      total: 251,
      page: 2,
      limit: 20,
      nextCursor: "abc",
    });
    expect(list.data).toHaveLength(1);
    expect(list.data[0]?.name).toBe("Ok");
    expect(list.total).toBe(251);
    expect(list.page).toBe(2);
    expect(list.nextCursor).toBe("abc");
  });

  it("survives a junk payload", () => {
    expect(parseProductList("nope")).toEqual({
      data: [],
      total: 0,
      page: 1,
      limit: 20,
      nextCursor: undefined,
    });
  });
});
