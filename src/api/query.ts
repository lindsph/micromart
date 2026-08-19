import type { ProductListResponse } from "./types";

const MAX_LIMIT = 100;

export type ProductListQuery = {
  page?: number;
  limit?: number;
  cursor?: string;
  search?: string;
  category?: string;
  brand?: string;
  tags?: string[];
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  order?: "asc" | "desc";
};

function clampLimit(limit: number): number {
  return Math.min(MAX_LIMIT, Math.max(1, Math.floor(limit)));
}

/** Build a query string with URLSearchParams so search/filter values stay encoded. */
export function productListPath(query: ProductListQuery = {}): string {
  const params = new URLSearchParams();

  if (query.cursor) {
    params.set("cursor", query.cursor);
  } else if (query.page && query.page > 1) {
    params.set("page", String(Math.floor(query.page)));
  }

  if (query.limit != null) {
    params.set("limit", String(clampLimit(query.limit)));
  }

  const search = query.search?.trim();
  if (search) {
    params.set("search", search);
  }
  if (query.category) {
    params.set("category", query.category);
  }
  if (query.brand) {
    params.set("brand", query.brand);
  }
  if (query.tags?.length) {
    params.set("tags", query.tags.join(","));
  }
  if (query.minPrice != null && Number.isFinite(query.minPrice)) {
    params.set("minPrice", String(query.minPrice));
  }
  if (query.maxPrice != null && Number.isFinite(query.maxPrice)) {
    params.set("maxPrice", String(query.maxPrice));
  }
  if (query.sort) {
    params.set("sort", query.sort);
  }
  if (query.order) {
    params.set("order", query.order);
  }

  const qs = params.toString();
  return qs ? `/api/v1/products?${qs}` : "/api/v1/products";
}

export type ListPageParam = {
  page?: number;
  cursor?: string;
};

/** Prefer the API cursor. Fall back to page math only when there is no cursor. */
export function nextListPageParam(
  lastPage: ProductListResponse,
): ListPageParam | undefined {
  if (lastPage.nextCursor) {
    return { cursor: lastPage.nextCursor };
  }

  const page = lastPage.page > 0 ? lastPage.page : 1;
  const limit = lastPage.limit;
  if (limit <= 0 || lastPage.data.length === 0) {
    return undefined;
  }
  if (page * limit < lastPage.total) {
    return { page: page + 1 };
  }
  return undefined;
}

export function categoriesPath(): string {
  return "/api/v1/categories";
}

export function productDetailPath(id: number): string {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Invalid product id");
  }
  return `/api/v1/products/${id}`;
}
