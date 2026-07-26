export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  photo?: string | null;
  price: number;
  cost_price: number;
  /**
   * true cuando cost_price no viene de una factura sino de calcular
   * precio x 0.81 (el margen del 19% que usa la contabilidad). Sirve para no
   * mostrar como dato firme un porcentaje que solo devuelve esa suposición.
   * Al editar el costo a mano debe pasar a false.
   */
  cost_is_estimated?: boolean;
  stock: number;
  category: string;
  description: string;
  created_at: string;
}

// Payload aceptado por createProduct/updateProduct en products.service
export type NewProduct = Omit<Product, "id" | "created_at"> &
  Partial<Pick<Product, "id" | "created_at">>;
export type ProductUpdate = Partial<Omit<Product, "id">>;
