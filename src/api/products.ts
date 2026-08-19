import { apiGet } from "./client";
import { ApiError } from "./errors";
import { parseProduct, parseProductList } from "./parseProduct";
import {
  categoriesPath,
  healthPath,
  productDetailPath,
  productListPath,
  type ProductListQuery,
} from "./query";
import type { Product, ProductListResponse } from "./types";

export type HealthStatus = { status: "ok" };

function isHealthOk(body: unknown): body is HealthStatus {
  return (
    typeof body === "object" &&
    body !== null &&
    "status" in body &&
    (body as { status: unknown }).status === "ok"
  );
}

export async function fetchHealth(signal?: AbortSignal): Promise<HealthStatus> {
  const body = await apiGet<unknown>(healthPath(), signal);
  if (!isHealthOk(body)) {
    throw new ApiError("Health response was not valid", undefined, false);
  }
  return body;
}

export async function fetchProductList(
  query: ProductListQuery,
  signal?: AbortSignal,
): Promise<ProductListResponse> {
  const body = await apiGet<unknown>(productListPath(query), signal);
  return parseProductList(body);
}

export async function fetchCategories(signal?: AbortSignal): Promise<string[]> {
  const body = await apiGet<unknown>(categoriesPath(), signal);
  if (!Array.isArray(body)) {
    throw new ApiError("Categories response was not valid", undefined, false);
  }
  return body.filter((item): item is string => typeof item === "string");
}

export async function fetchProduct(
  id: number,
  signal?: AbortSignal,
): Promise<Product> {
  const body = await apiGet<unknown>(productDetailPath(id), signal);
  const product = parseProduct(body);
  if (!product) {
    throw new Error("Product response was not valid");
  }
  return product;
}
