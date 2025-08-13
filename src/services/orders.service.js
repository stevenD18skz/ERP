import { orders } from "../lib/mock";

export const getOrders = async () => {
  try {
    const response = orders;
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.error || "Error fetching orders");
  }
};

export const getOrderById = async (id) => {
  try {
    const response = orders.find((order) => order.id === id);
    if (!response) {
      throw new Error("Order not found");
    }
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.error || "Error fetching order");
  }
};

export const createOrder = async (order) => {
  try {
    const response = orders.push(order);
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.error || "Error creating order");
  }
};

export const createOrderWithDetails = async (order, orderDetails) => {
  try {
    const response = orders.push({
      ...order,
      orderDetails,
    });
    return response;
  } catch (error) {
    throw new Error(
      error.response?.data?.error || "Error creating order with details",
    );
  }
};

export const updateOrder = async (id, order) => {
  try {
    const response = orders.find((order) => order.id === id);
    if (!response) {
      throw new Error("Order not found");
    }
    orders[orders.indexOf(response)] = {
      ...response,
      ...order,
    };
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.error || "Error updating order");
  }
};

export const deleteOrder = async (id) => {
  try {
    const response = orders.find((order) => order.id === id);
    if (!response) {
      throw new Error("Order not found");
    }
    orders.splice(orders.indexOf(response), 1);
    return { message: "Order deleted" };
  } catch (error) {
    throw new Error(error.response?.data?.error || "Error deleting order");
  }
};
