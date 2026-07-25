import { sales, products } from "../lib/mockDb";

export const getSales = async () => {
  try {
    const response = sales;
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.error || "Error fetching sales");
  }
};

export const getSaleById = async (id) => {
  try {
    const response = sales.find((sale) => sale.id === id);
    if (!response) {
      throw new Error("Sale not found");
    }
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.error || "Error fetching sale");
  }
};

export const createSale = async (sale) => {
  try {
    const response = sales.push(sale);
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.error || "Error creating sale");
  }
};

export const createSaleWithDetails = async (sale, saleProducts) => {
  const detailedProducts = saleProducts.map((p) => {
    const product = products.find(
      (prod) => String(prod.id) === String(p.product_id),
    );
    return {
      product_id: p.product_id,
      product: product ? product.name : `Producto #${p.product_id}`,
      quantity: p.quantity,
      sale_price: p.sale_price ?? product?.price ?? 0,
    };
  });
  sales.unshift({
    id: `s${Date.now()}`,
    ...sale,
    products: detailedProducts,
  });
  return Promise.resolve();
};

export const updateSale = async (id, sale) => {
  try {
    const response = sales.find((sale) => sale.id === id);
    if (!response) {
      throw new Error("Sale not found");
    }
    sales.splice(sales.indexOf(response), 1, {
      ...response,
      ...sale,
    });
    return { message: "Sale updated" };
  } catch (error) {
    throw new Error(error.response?.data?.error || "Error updating sale");
  }
};

export const deleteSale = async (id) => {
  try {
    const response = sales.find((sale) => sale.id === id);
    if (!response) {
      throw new Error("Sale not found");
    }
    sales.splice(sales.indexOf(response), 1);
    return { message: "Sale deleted" };
  } catch (error) {
    throw new Error(error.response?.data?.error || "Error deleting sale");
  }
};
