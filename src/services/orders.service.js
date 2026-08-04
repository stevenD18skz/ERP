// Pedidos a proveedores.
//
// Crear el pedido no toca el inventario: la mercancía entra cuando la
// pantalla de pedidos lo marca como recibido (updateOrder con status
// "recibido", que en modo real pasa por receive_order() en la base).

import { collection, commit, isSimulationOn } from "../lib/dataSource";
import { apiFetch, apiFetchAll } from "../lib/api/client";
import { uid } from "../utils/id";

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
        id: uid(),
        product_id: line.product_id,
        product: product ? product.name : `Producto #${line.product_id}`,
        quantity: line.quantity,
        unit_cost: line.unit_cost ?? product?.cost_price ?? 0,
        status: "por_pedir",
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

// El total de un pedido nunca cuenta lo que quedó cancelado dentro de él,
// igual que del lado del servidor (create_order/add_order_item/
// update_order_item_status en supabase/sql/01_schema.sql).
const recomputeTotal = (order) => {
  order.total_amount = order.products
    .filter((line) => line.status !== "cancelado")
    .reduce((sum, line) => sum + Number(line.quantity) * Number(line.unit_cost), 0);
};

// Marca el pedido como recibido y suma al inventario lo que traía cada línea
// no cancelada. Es el único punto de Pedidos que mueve stock: en modo real
// pasa por receive_order() en la base (idempotente), así que acá NO hay que
// además sumar el stock a mano desde quien llama a esta función.
export const receiveOrder = async (
  id,
  { adjustStock = true, updateCost = false } = {},
) => {
  if (isSimulationOn()) {
    const order = all().find((o) => sameId(o.id, id));
    if (!order) throw new Error("Order not found");
    if (order.status === "recibido") return order; // idempotente
    if (order.status === "cancelado") {
      throw new Error("El pedido está cancelado y no se puede recibir");
    }

    if (adjustStock) {
      const products = collection("products");
      order.products.forEach((line) => {
        if (line.status === "cancelado") return;
        const product = products.find((p) => sameId(p.id, line.product_id));
        if (product) product.stock = Number(product.stock ?? 0) + Number(line.quantity);
      });
      commit("products");
    }
    if (updateCost) {
      const products = collection("products");
      order.products.forEach((line) => {
        if (line.status === "cancelado" || !(line.unit_cost > 0)) return;
        const product = products.find((p) => sameId(p.id, line.product_id));
        if (product) product.cost_price = line.unit_cost;
      });
      commit("products");
    }

    order.products.forEach((line) => {
      if (line.status !== "cancelado") line.status = "recibido";
    });
    order.status = "recibido";
    order.received_at = new Date().toISOString();
    commit("orders");
    return order;
  }
  const { data } = await apiFetch(`/api/orders/${id}/receive`, {
    method: "POST",
    body: JSON.stringify({ adjust_stock: adjustStock, update_cost: updateCost }),
  });
  return data;
};

// Cancela el pedido completo: si ya estaba recibido, revierte el stock que
// había sumado (solo lo no cancelado), y cancela también todas sus líneas.
export const cancelOrder = async (id, { adjustStock = true } = {}) => {
  if (isSimulationOn()) {
    const order = all().find((o) => sameId(o.id, id));
    if (!order) throw new Error("Order not found");
    if (order.status === "cancelado") return order;

    if (adjustStock && order.status === "recibido") {
      const products = collection("products");
      order.products.forEach((line) => {
        if (line.status === "cancelado") return;
        const product = products.find((p) => sameId(p.id, line.product_id));
        if (product) product.stock = Number(product.stock ?? 0) - Number(line.quantity);
      });
      commit("products");
    }

    order.products.forEach((line) => {
      line.status = "cancelado";
    });
    order.status = "cancelado";
    order.received_at = null;
    commit("orders");
    return order;
  }
  const { data } = await apiFetch(`/api/orders/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "cancelado", adjust_stock: adjustStock }),
  });
  return data;
};

// Agrega un producto a un pedido que sigue pendiente: así se puede ir armando
// "lo que hace falta pedir" a lo largo de varios días, sin tener que saberlo
// todo el mismo día en que se crea el pedido.
export const addOrderItem = async (orderId, item) => {
  if (isSimulationOn()) {
    const order = all().find((o) => sameId(o.id, orderId));
    if (!order) throw new Error("Order not found");
    if (order.status !== "pendiente") {
      throw new Error("Solo se pueden agregar productos a un pedido pendiente");
    }
    const products = collection("products");
    const product = products.find((p) => sameId(p.id, item.product_id));
    order.products = [
      ...order.products,
      {
        id: uid(),
        product_id: item.product_id ?? null,
        product: item.product || product?.name || "Producto sin registrar",
        quantity: Number(item.quantity),
        unit_cost: Number(item.unit_cost ?? product?.cost_price ?? 0),
        status: "por_pedir",
      },
    ];
    recomputeTotal(order);
    commit("orders");
    return order;
  }
  const { data } = await apiFetch(`/api/orders/${orderId}/items`, {
    method: "POST",
    body: JSON.stringify(item),
  });
  return data;
};

// Mueve un producto de un pedido pendiente entre por_pedir/en_espera, o lo
// cancela individualmente sin tocar el resto del pedido. "recibido" no se
// acepta acá: se pone solo, junto para todas las líneas, al recibir el
// pedido completo (receiveOrder de arriba).
export const updateOrderItemStatus = async (orderId, itemId, status) => {
  if (isSimulationOn()) {
    const order = all().find((o) => sameId(o.id, orderId));
    if (!order) throw new Error("Order not found");
    if (order.status !== "pendiente") {
      throw new Error(
        "El pedido ya está cerrado: no se puede cambiar el estado de sus productos",
      );
    }
    const line = order.products.find((l) => sameId(l.id, itemId));
    if (!line) throw new Error("Producto del pedido no encontrado");
    line.status = status;
    recomputeTotal(order);
    commit("orders");
    return order;
  }
  const { data } = await apiFetch(`/api/orders/${orderId}/items/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  return data;
};
