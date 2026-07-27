// Ventas registradas una por una desde la aplicación.
//
// createSaleWithDetails arma la venta completa: guarda el encabezado y resuelve
// el nombre y el precio de cada producto contra el catálogo, para que la venta
// quede con el nombre que tenía el producto el día que se vendió.

import { collection, commit } from "../lib/dataSource";

const all = () => collection("sales");

const sameId = (a, b) => String(a) === String(b);

export const getSales = async () => [...all()];

export const getSaleById = async (id) => {
  const sale = all().find((s) => sameId(s.id, id));
  if (!sale) throw new Error("Sale not found");
  return sale;
};

export const createSale = async (sale) => {
  all().unshift(sale);
  commit("sales");
  return sale;
};

export const createSaleWithDetails = async (sale, saleProducts) => {
  const products = collection("products");

  const detailedProducts = saleProducts.map((line) => {
    const product = products.find((p) => sameId(p.id, line.product_id));
    return {
      product_id: line.product_id,
      product: product ? product.name : `Producto #${line.product_id}`,
      quantity: line.quantity,
      sale_price: line.sale_price ?? product?.price ?? 0,
      discount_type: line.discount_type ?? null,
      discount_value: line.discount_value ?? 0,
    };
  });

  const created = {
    id: `s${Date.now()}`,
    payment_method: "efectivo",
    client_name: null,
    voided: false,
    ...sale,
    products: detailedProducts,
  };

  all().unshift(created);
  commit("sales");
  return created;
};

export const updateSale = async (id, changes) => {
  const sale = all().find((s) => sameId(s.id, id));
  if (!sale) throw new Error("Sale not found");
  Object.assign(sale, changes);
  commit("sales");
  return sale;
};

export const deleteSale = async (id) => {
  const sales = all();
  const index = sales.findIndex((s) => sameId(s.id, id));
  if (index === -1) throw new Error("Sale not found");
  sales.splice(index, 1);
  commit("sales");
  return { message: "Sale deleted" };
};
