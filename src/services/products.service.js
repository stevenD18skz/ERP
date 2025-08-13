import { products } from "../lib/mock";

export const getProducts = async () => {
  try {
    const response = products;
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.error || "Error fetching products");
  }
};

export const getProductById = async (id) => {
  try {
    const response = products.find((product) => product.id === id);
    if (!response) {
      throw new Error("Product not found");
    }
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.error || "Error fetching product");
  }
};

export const createProduct = async (product) => {
  try {
    const response = products.push(product);
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.error || "Error creating product");
  }
};

export const updateProduct = async (id, product) => {
  try {
    const response = products.find((product) => product.id === id);
    if (!response) {
      throw new Error("Product not found");
    }
    response.name = product.name;
    response.description = product.description;
    response.price = product.price;
    response.stock = product.stock;
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.error || "Error updating product");
  }
};

export const deleteProduct = async (id) => {
  try {
    const response = products.find((product) => product.id === id);
    if (!response) {
      throw new Error("Product not found");
    }
    products.splice(products.indexOf(response), 1);
    return { message: "Product deleted" };
  } catch (error) {
    throw new Error(error.response?.data?.error || "Error deleting product");
  }
};
