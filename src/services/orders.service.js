// Pedidos a proveedores.
//
// Crear el pedido no toca el inventario: la mercancía entra cuando la
// pantalla de pedidos lo marca como recibido (updateOrder con status
// "recibido", que en modo real pasa por receive_order() en la base).

import { collection, commit, isSimulationOn } from "../lib/dataSource";
import { apiFetch, apiFetchAll } from "../lib/api/client";

const all = () => collection("orders");

const sameId = (a, b) => String(a) === String(b);

export const getOrders = async () => {
  if (isSimulationOn()) return [...all()];
  return apiFetchAll("/api/orders");
};

export const getOrderById = async (id) => {
  if (isSimulationOn()) {
    const order = all().find((o) => sameId(o.id, id));
    if (!order) throw new Error("Order not found");
    return order;
  }
  const { data } = await apiFetch(`/api/orders/${id}`);
  return data;
};

export const createOrder = async (order) => {
  if (isSimulationOn()) {
    all().unshift(order);
    commit("orders");
    return order;
  }
  const { data } = await apiFetch("/api/orders", {
    method: "POST",
    body: JSON.stringify(order),
  });
  return data;
};

export const createOrderWithDetails = async (order, orderDetails) => {
  if (isSimulationOn()) {
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
  }

  const { data } = await apiFetch("/api/orders", {
    method: "POST",
    body: JSON.stringify({ ...order, products: orderDetails }),
  });
  return data;
};

export const updateOrder = async (id, changes) => {
  if (isSimulationOn()) {
    const order = all().find((o) => sameId(o.id, id));
    if (!order) throw new Error("Order not found");
    Object.assign(order, changes);
    commit("orders");
    return order;
  }
  const { data } = await apiFetch(`/api/orders/${id}`, {
    method: "PATCH",
    body: JSON.stringify(changes),
  });
  return data;
};

export const deleteOrder = async (id) => {
  if (isSimulationOn()) {
    const orders = all();
    const index = orders.findIndex((o) => sameId(o.id, id));
    if (index === -1) throw new Error("Order not found");
    orders.splice(index, 1);
    commit("orders");
    return { message: "Order deleted" };
  }
  await apiFetch(`/api/orders/${id}`, { method: "DELETE" });
  return { message: "Order deleted" };
};
