import type { Product, ProductListResponse, ProductSize } from "./types";

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asFiniteOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === "string");
}

function parseSize(value: unknown): ProductSize {
  const size = asRecord(value);
  return {
    value: asNumber(size?.value, 0),
    unit: asString(size?.unit, ""),
  };
}

export function parseProduct(value: unknown): Product | null {
  const raw = asRecord(value);
  if (!raw || typeof raw.id !== "number" || !Number.isFinite(raw.id)) {
    return null;
  }

  return {
    id: raw.id,
    name: asString(raw.name),
    brand: asString(raw.brand),
    description: asString(raw.description),
    price: asFiniteOrNull(raw.price),
    cost: asFiniteOrNull(raw.cost),
    category: asString(raw.category),
    imageUrl: asString(raw.imageUrl),
    stock: asFiniteOrNull(raw.stock),
    sku: asString(raw.sku),
    size: parseSize(raw.size),
    status: asString(raw.status),
    createdAt: asString(raw.createdAt),
    updatedAt: asString(raw.updatedAt),
    tags: asStringArray(raw.tags),
  };
}

export function parseProductList(value: unknown): ProductListResponse {
  const raw = asRecord(value);
  const rows = Array.isArray(raw?.data) ? raw.data : [];

  return {
    data: rows
      .map(parseProduct)
      .filter((product): product is Product => product !== null),
    total: asNumber(raw?.total),
    page: asNumber(raw?.page, 1),
    limit: asNumber(raw?.limit, 20),
    nextCursor:
      typeof raw?.nextCursor === "string" ? raw.nextCursor : undefined,
  };
}
