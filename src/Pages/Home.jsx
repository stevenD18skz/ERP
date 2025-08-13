import { useEffect, useState } from "react";

import { getSales } from "../services/sales.service";
import { getProducts } from "../services/products.service";

function Home() {
  const [stats, setStats] = useState({});
  useEffect(() => {
    async function fetchStats() {
      try {
        const salesRes = await getSales();
        const productsRes = await getProducts();
        // Calcular producto más vendido
        let productSales = {};
        salesRes.data.forEach((sale) => {
          sale.products.forEach((p) => {
            productSales[p.product_id] =
              (productSales[p.product_id] || 0) + p.quantity;
          });
        });
        let maxProductId = Object.keys(productSales).reduce(
          (a, b) => (productSales[a] > productSales[b] ? a : b),
          null,
        );
        let maxProduct = productsRes.data.find((p) => p.id === maxProductId);
        // Calcular venta más alta
        let maxSale = salesRes.data.reduce(
          (a, b) => (a.total > b.total ? a : b),
          {},
        );
        setStats({
          mostSold: maxProduct ? maxProduct.name : "-",
          highestSale: maxSale.total || 0,
          highestSaleCustomer: maxSale.customer || "-",
        });
      } catch (e) {
        setStats({
          mostSold: "-",
          highestSale: 0,
          highestSaleCustomer: "-",
          error: e.message,
        });
      }
    }
    fetchStats();
  }, []);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-blue-300 p-6">
      <div className="w-full max-w-xl rounded-xl bg-white p-8 text-center shadow-lg">
        <img src="/vite.svg" alt="Logo" className="mx-auto mb-4 h-16 w-16" />
        <h1 className="mb-2 text-3xl font-bold text-blue-700">
          Bienvenido al ERP del Supermercado
        </h1>
        <p className="mb-6 text-gray-600">
          Gestiona tu supermercado de forma eficiente y visualiza datos clave en
          tiempo real.
        </p>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-lg bg-blue-50 p-4 shadow">
            <h2 className="mb-2 text-lg font-semibold text-blue-600">
              Producto más vendido
            </h2>
            <p className="text-2xl font-bold text-blue-900">{stats.mostSold}</p>
          </div>
          <div className="rounded-lg bg-blue-50 p-4 shadow">
            <h2 className="mb-2 text-lg font-semibold text-blue-600">
              Venta más alta
            </h2>
            <p className="text-2xl font-bold text-blue-900">
              ${stats.highestSale}
            </p>
            <p className="text-sm text-gray-500">
              Cliente: {stats.highestSaleCustomer}
            </p>
          </div>
        </div>
      </div>
      <footer className="mt-8 text-sm text-gray-400">
        Desarrollado por tu equipo ERP
      </footer>
    </div>
  );
}

export default Home;
