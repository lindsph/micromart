export const LOW_STOCK = 5;

/** Short menu for now. The API has ~60 brands; a full picker and tags are later. */
export const FEATURED_BRANDS = [
  "Coca-Cola",
  "Gatorade",
  "Fairlife",
  "Celsius",
  "Alani Nu",
  "Cheetos",
  "Starbucks",
] as const;

export type SortChoice =
  | "name-asc"
  | "name-desc"
  | "price-asc"
  | "price-desc"
  | "stock-asc"
  | "newest";

export function sortParams(sort: SortChoice): { sort: string; order: "asc" | "desc" } {
  switch (sort) {
    case "name-desc":
      return { sort: "name", order: "desc" };
    case "price-asc":
      return { sort: "price", order: "asc" };
    case "price-desc":
      return { sort: "price", order: "desc" };
    case "stock-asc":
      return { sort: "stock", order: "asc" };
    case "newest":
      return { sort: "createdAt", order: "desc" };
    default:
      return { sort: "name", order: "asc" };
  }
}

/** Clearing the box must hit the API immediately; typing stays debounced. */
export function liveListSearch(liveValue: string, debouncedValue: string): string {
  return liveValue.trim() ? debouncedValue.trim() : "";
}
