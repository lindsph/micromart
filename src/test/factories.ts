import type { Product } from "../api/types";

export function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 1,
    name: "Sparkling Water",
    brand: "Bubly",
    description: "Lime sparkling water",
    price: 1.99,
    cost: 0.6,
    category: "Drink",
    imageUrl: "https://res.cloudinary.com/demo/image/upload/v1/water.jpg",
    stock: 24,
    sku: "BUB-LIME-12",
    size: { value: 12, unit: "oz" },
    status: "finalized",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
    tags: ["Sparkling"],
    ...overrides,
  };
}
