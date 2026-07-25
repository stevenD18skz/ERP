export interface SaleProductLine {
  product_id: string;
  product: string;
  quantity: number;
  sale_price: number;
}

export interface Sale {
  id: string;
  sale_date: string;
  total_amount: number;
  gain: number;
  products: SaleProductLine[];
}

// Datos del encabezado que arma sales/page.jsx antes de enviar la venta
export interface NewSaleInput {
  total_amount: number;
  sale_date: string;
  gain: number;
}

// Cada línea de producto que se envía a createSaleWithDetails
export interface SaleLineInput {
  product_id: string | null;
  quantity: number;
  sale_price: number;
}
