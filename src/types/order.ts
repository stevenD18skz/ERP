export type OrderStatus = "pendiente" | "recibido" | "cancelado";

// Fase de un producto DENTRO de un pedido, aparte de OrderStatus (que es del
// pedido completo). "recibido" se pone solo, junto para todas las líneas, al
// recibir el pedido entero: el proveedor siempre entrega todo de una vez.
export type OrderItemStatus = "por_pedir" | "en_espera" | "recibido" | "cancelado";

export interface OrderProductLine {
  id: string;
  product_id: string;
  product: string;
  quantity: number;
  unit_cost: number;
  status: OrderItemStatus;
}

export interface Order {
  id: string;
  order_date: string;
  supplier: string;
  supplier_id: string | null;
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
  supplier_id: string | null;
  expected_delivery: string | null;
  notes: string;
  status: OrderStatus;
  attachment?: string | null;
}

// Un proveedor de la tienda (ver suppliers en supabase/sql/01_schema.sql).
// order_count son los pedidos activos (no cancelados) que ya tiene, igual
// que product_count en categorías/marcas.
export interface Supplier {
  id: string;
  name: string;
  order_count: number;
}

// Cada línea de producto que se envía a createOrderWithDetails
export interface OrderLineInput {
  product_id: string | null;
  quantity: number;
  unit_cost: number;
}
