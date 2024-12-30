import React, { useState, useEffect } from "react";

import { formatMoneySymbol, formatMoney } from "../utils/converts";

import { CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Registro de los componentes para Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

import { getSales } from "../services/portSales";
const SummaryPage = () => {
  const [allsales, setAllSales] = useState([]);

  useEffect(() => {
    const fetchSales = async () => {
      const sales = await getSales();
      setAllSales(sales);
    };

    fetchSales();
  }, []);

  const fetchEarningFull = () => {
    let total = 0;
    allsales.forEach((sale) => {
      total += sale.total_amount;
    });
    return formatMoneySymbol(total);
  };

  const fetchTotalCost = () => {
    let total = 0;
    allsales.forEach((sale) => {
      total += sale.total_amount - sale.gain;
    });
    return formatMoneySymbol(total);
  };

  const fetchGrossProfit = () => {
    let total = 0;
    allsales.forEach((sale) => {
      total += sale.gain;
    });
    return formatMoneySymbol(total);
  };

  const fetchProfitMargin = () => {
    let GananciaBruta = 0;
    allsales.forEach((sale) => {
      GananciaBruta += sale.gain;
    });

    let IngresosTotales = 0;
    allsales.forEach((sale) => {
      IngresosTotales += sale.total_amount;
    });
    const total = (GananciaBruta / IngresosTotales) * 100;

    return total.toFixed(2);
  };

  const fetchTopProducts = () => {
    let products = {};

    allsales.forEach((sale) => {
      sale.products.forEach((product) => {
        if (products[product.product_id]) {
          products[product.product_id].quantity += product.quantity;
        } else {
          products[product.product_id] = {
            id: product.product_id,
            name: product.product,
            quantity: product.quantity,
          };
        }
      });
    });

    const sortedProducts = Object.values(products).sort(
      (a, b) => b.quantity - a.quantity,
    );

    return sortedProducts.slice(0, 5);
  };

  // Datos para el gráfico de líneas
  const getLineChartData = () => {
    // Generar datos agrupados por día (puedes ajustarlo según necesites)
    const groupedData = allsales.reduce((acc, sale) => {
      const date = new Date(sale.sale_date).toLocaleDateString(); // Formatear la fecha
      acc[date] = (acc[date] || 0) + sale.gain;
      return acc;
    }, {});

    const labels = Object.keys(groupedData);
    const data = Object.values(groupedData);

    return {
      labels,
      datasets: [
        {
          label: "Ganancia Bruta por Día",
          data,
          borderColor: "rgba(75, 192, 192, 1)",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          tension: 0.3,
        },
      ],
    };
  };

  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Ganancias en el Tiempo" },
    },
  };

  return (
    <div className="summary min-h-screen rounded-3xl bg-gradient-to-r from-blue-50 to-blue-100 p-6">
      <h1 className="mb-8 text-center text-5xl font-extrabold text-gray-800">
        Resumen del Supermercado ERP
      </h1>

      <div className="summary-section mb-8 rounded-xl bg-gradient-to-br from-gray-50 to-white p-8 shadow-2xl">
        <h2 className="mb-6 flex items-center gap-2 text-4xl font-bold text-gray-700">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="h-8 w-8 text-blue-500"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16 12h-4m0 0H8m4 0v4m0-4V8m6 4a6 6 0 11-12 0 6 6 0 0112 0z"
            />
          </svg>
          Resumen de Ventas
        </h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Tarjeta 1 */}
          <div className="group flex flex-col items-center justify-center rounded-lg bg-gradient-to-br from-green-100 to-green-50 p-6 shadow-md transition-shadow duration-300 hover:shadow-lg">
            <h3 className="mb-2 flex items-center gap-2 text-xl font-medium text-gray-600">
              Ingresos Totales
            </h3>
            <p className="text-4xl font-bold text-green-600">
              {fetchEarningFull() || "calculando..."}
            </p>
          </div>

          {/* Tarjeta 2 */}
          <div className="group flex flex-col items-center justify-center rounded-lg bg-gradient-to-br from-red-100 to-red-50 p-6 shadow-md transition-shadow duration-300 hover:shadow-lg">
            <h3 className="mb-2 flex items-center gap-2 text-xl font-medium text-gray-600">
              Costos Totales
            </h3>
            <p className="text-4xl font-bold text-red-600">
              {fetchTotalCost() || "calculando..."}
            </p>
          </div>

          {/* Tarjeta 3 */}
          <div className="group flex flex-col items-center justify-center rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 p-6 shadow-md transition-shadow duration-300 hover:shadow-lg">
            <h3 className="mb-2 flex items-center gap-2 text-xl font-medium text-gray-600">
              Ganancia Bruta
            </h3>
            <p className="text-4xl font-bold text-blue-600">
              {fetchGrossProfit() || "calculando..."}
            </p>
          </div>
          {/* Tarjeta 4 */}

          <div className="group flex flex-col items-center justify-center rounded-lg bg-gradient-to-br from-yellow-100 to-yellow-50 p-6 shadow-md transition-shadow duration-300 hover:shadow-lg">
            <h3 className="mb-2 flex items-center gap-2 text-xl font-medium text-gray-600">
              Margen de Ganancia
              <i className="fas fa-chart-line text-yellow-400"></i>
            </h3>
            <p className="text-4xl font-bold text-yellow-600">
              {fetchProfitMargin() || "calculando..."}%
            </p>
          </div>

          <div className="group flex flex-col items-center justify-center rounded-lg bg-gradient-to-br from-yellow-100 to-yellow-50 p-6 shadow-md transition-shadow duration-300 hover:shadow-lg">
            <h3 className="mb-2 flex items-center gap-2 text-xl font-medium text-gray-600">
              Margen de Ganancia
              <i className="fas fa-chart-line text-yellow-400"></i>
            </h3>
            <div className="h-24 w-24 text-4xl font-bold text-yellow-600">
              <CircularProgressbar
                value={fetchProfitMargin() || 0}
                text={`${fetchProfitMargin() || 0}%`}
                strokeWidth={10}
                styles={{
                  path: { stroke: "#F59E0B" }, // Amarillo
                  text: { fill: "#F59E0B", fontSize: "20px" },
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="summary-section mb-8 rounded-xl bg-gradient-to-br from-blue-50 to-white p-8 shadow-2xl">
        <h2 className="mb-6 flex items-center gap-2 text-4xl font-bold text-blue-700">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="h-8 w-8 text-blue-500"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 3h18M9 21h6M10 3L8 7h8l-2-4M10 7h4M10 7l-2 4h8l-2-4M14 7v8m-4-8v8"
            />
          </svg>
          Productos Más Vendidos
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {fetchTopProducts().length > 0 ? (
            fetchTopProducts().map((product) => (
              <div
                key={product.id}
                className="flex flex-col items-center rounded-lg bg-white p-6 shadow-md transition-shadow duration-300 hover:shadow-lg"
              >
                <div className="text-2xl font-semibold text-gray-700">
                  {product.name}
                </div>
                <div className="mt-2 text-lg text-gray-500">
                  <span className="font-bold text-blue-500">
                    {product.quantity}
                  </span>{" "}
                  vendidos
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center text-lg text-gray-500">
              Calculando...
            </div>
          )}
        </div>
      </div>

      <div className="summary-section mb-8 rounded-xl bg-white p-8 shadow-lg">
        <h2 className="mb-6 text-4xl font-semibold text-gray-700">Gráficos</h2>
        <div className="mb-6">
          <Line data={getLineChartData()} options={lineChartOptions} />
        </div>
      </div>

      <div className="summary-section mb-8 rounded-xl bg-white p-8 shadow-lg">
        <h2 className="mb-6 text-4xl font-semibold text-gray-700">
          Resumen Semanal
        </h2>
        <table className="w-full table-auto border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2 text-left text-gray-600">
                Métrica
              </th>
              <th className="border border-gray-300 px-4 py-2 text-right text-gray-600">
                Valor
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 px-4 py-2 text-gray-700">
                Ingresos Totales
              </td>
              <td className="border border-gray-300 px-4 py-2 text-right text-gray-700">
                {fetchEarningFull()}
              </td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2 text-gray-700">
                Costos Totales
              </td>
              <td className="border border-gray-300 px-4 py-2 text-right text-gray-700">
                {fetchTotalCost()}
              </td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2 text-gray-700">
                Ganancia Bruta
              </td>
              <td className="border border-gray-300 px-4 py-2 text-right text-gray-700">
                {fetchGrossProfit()}
              </td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2 text-gray-700">
                Margen de Ganancia
              </td>
              <td className="border border-gray-300 px-4 py-2 text-right text-gray-700">
                {fetchProfitMargin()}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="summary-section mb-8 rounded-xl bg-white p-8 shadow-lg">
        <h2 className="mb-6 text-4xl font-semibold text-gray-700">Pedidos</h2>
        <p className="text-lg text-gray-700">Pedidos pendientes: 5</p>
        <p className="text-lg text-gray-700">Pedidos completados: 20</p>
      </div>

      <div className="summary-section mb-8 rounded-xl bg-white p-8 shadow-lg">
        <h2 className="mb-6 text-4xl font-semibold text-gray-700">
          Inventario
        </h2>
        <p className="text-lg text-gray-700">Productos en stock: 150</p>
        <p className="text-lg text-gray-700">Productos agotados: 10</p>
      </div>
    </div>
  );
};

export default SummaryPage;
