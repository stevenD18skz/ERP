import supabase from "./api";

export const getOrders = async () => {
  const { data: orders, error } = await supabase.from("orders").select("*");
  if (error) throw error;

  console.log(orders);

  const ordersWithDetails = await Promise.all(
    orders.map(async (order) => {
      const { data: orderDetails, error: errorDetails } = await supabase
        .from("orderDetails")
        .select("*")
        .eq("order_id", order.id);
      if (errorDetails) throw errorDetails;

      const productsWithDetails = await Promise.all(
        orderDetails.map(async (product) => {
          const { data: productData, error: errorProduct } = await supabase
            .from("products")
            .select("*")
            .eq("id", product.product_id)
            .single();
          if (errorProduct) throw errorProduct;

          return {
            ...product,
            product: productData.name,
            price: productData.price,
          };
        }),
      );

      return {
        ...order,
        products: productsWithDetails,
      };
    }),
  );

  // Sort orders by date, most recent first
  ordersWithDetails.sort(
    (a, b) => new Date(b.order_date) - new Date(a.order_date),
  );

  console.log(ordersWithDetails);

  return ordersWithDetails;
};

export const getOrderById = async (id) => {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
};

export const createOrder = async (order) => {
  const { data, error } = await supabase.from("orders").insert([order]);
  if (error) throw error;
  return data;
};

export const createOrderWithDetails = async (order, orderDetails) => {
  const { data: orderData, error: orderError } = await supabase
    .from("orders")
    .insert([order])
    .select();

  if (orderError) throw orderError;

  const orderId = orderData[0].id;

  const orderDetailsWithOrderId = orderDetails.map((detail) => ({
    ...detail,
    order_id: orderId,
  }));

  const { data: orderDetailsData, error: orderDetailsError } = await supabase
    .from("orderDetails")
    .insert(orderDetailsWithOrderId);
  if (orderDetailsError) throw orderDetailsError;

  return { order: orderData[0], orderDetails: orderDetailsData };
};

export const updateOrder = async (id, order) => {
  const { data, error } = await supabase
    .from("orders")
    .update(order)
    .eq("id", id);
  if (error) throw error;
  return data;
};

export const deleteOrder = async (id) => {
  const { data, error } = await supabase.from("orders").delete().eq("id", id);
  if (error) throw error;
  return data;
};
