export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  photo?: string | null;
  price: number;
  cost_price: number;
  stock: number;
  category: string;
  description: string;
  created_at: string;
}

// Payload aceptado por createProduct/updateProduct en products.service
export type NewProduct = Omit<Product, "id" | "created_at"> &
  Partial<Pick<Product, "id" | "created_at">>;
export type ProductUpdate = Partial<Omit<Product, "id">>;
