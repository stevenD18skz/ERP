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
  /**
   * Nombre de la categoría, ya resuelto. La categoría vive en su propia tabla
   * (ver supabase/sql/09_categorias_y_marcas.sql); esto es lo que se muestra y
   * lo que se busca en pantalla. Vacío cuando el producto no tiene ninguna.
   */
  category: string;
  /** Id de la categoría. null = sin categoría. */
  category_id?: string | null;
  /** Nombre de la marca, con la misma forma que la categoría. */
  brand?: string;
  /** Id de la marca. null = sin marca. */
  brand_id?: string | null;
  description: string;
  created_at: string;
}

// Payload aceptado por createProduct/updateProduct en products.service
export type NewProduct = Omit<Product, "id" | "created_at"> &
  Partial<Pick<Product, "id" | "created_at">>;
export type ProductUpdate = Partial<Omit<Product, "id">>;
