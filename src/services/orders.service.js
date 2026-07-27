// Pedidos a proveedores.
//
// Crear el pedido no toca el inventario: la mercancía entra cuando la pantalla
// de pedidos lo marca como recibido y suma el stock producto por producto.

import { collection, commit } from "../lib/dataSource";

const all = () => collection("orders");

const sameId = (a, b) => String(a) === String(b);

export const getOrders = async () => [...all()];

export const getOrderById = async (id) => {
  const order = all().find((o) => sameId(o.id, id));
  if (!order) throw new Error("Order not found");
  return order;
};

export const createOrder = async (order) => {
  all().unshift(order);
  commit("orders");
  return order;
};

export const createOrderWithDetails = async (order, orderDetails) => {
  const products = collection("products");

  const detailedProducts = orderDetails.map((line) => {
    const product = products.find((p) => sameId(p.id, line.product_id));
    return {
      product_id: line.product_id,
      product: product ? product.name : `Producto #${line.product_id}`,
      quantity: line.quantity,
      unit_cost: line.unit_cost ?? product?.cost_price ?? 0,
    };
  });

  const created = {
    id: `o${Date.now()}`,
    status: "pendiente",
    attachment: null,
    ...order,
    products: detailedProducts,
  };

  all().unshift(created);
  commit("orders");
  return created;
};

export const updateOrder = async (id, changes) => {
  const order = all().find((o) => sameId(o.id, id));
  if (!order) throw new Error("Order not found");
  Object.assign(order, changes);
  commit("orders");
  return order;
};

export const deleteOrder = async (id) => {
  const orders = all();
  const index = orders.findIndex((o) => sameId(o.id, id));
  if (index === -1) throw new Error("Order not found");
  orders.splice(index, 1);
  commit("orders");
  return { message: "Order deleted" };
};
