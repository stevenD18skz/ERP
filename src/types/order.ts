export type OrderStatus = "pendiente" | "recibido" | "cancelado";

export interface OrderProductLine {
  product_id: string;
  product: string;
  quantity: number;
  unit_cost: number;
}

export interface Order {
  id: string;
  order_date: string;
  supplier: string;
  expected_delivery: string | null;
  notes: string;
  total_amount: number;
  status: OrderStatus;
  attachment?: string | null;
  products: OrderProductLine[];
}

// Datos del encabezado que arma orders/page.jsx antes de enviar la orden
export interface NewOrderInput {
  total_amount: number;
  order_date: string;
  supplier: string;
  expected_delivery: string | null;
  notes: string;
  status: OrderStatus;
  attachment?: string | null;
}

// Cada línea de producto que se envía a createOrderWithDetails
export interface OrderLineInput {
  product_id: string | null;
  quantity: number;
  unit_cost: number;
}
