export type ProductStatus = "draft" | "finalized" | string;

export type ProductSize = {
  value: number;
  unit: string;
};

export type Product = {
  id: number;
  name: string;
  brand: string;
  description: string;
  price: number | null;
  cost: number | null;
  category: string;
  imageUrl: string;
  stock: number | null;
  sku: string;
  size: ProductSize;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
  tags: string[];
};

export type ProductListResponse = {
  data: Product[];
  total: number;
  page: number;
  limit: number;
  nextCursor?: string;
};
