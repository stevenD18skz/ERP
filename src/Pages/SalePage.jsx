import React, { useState, useEffect } from "react";
import "tailwindcss/tailwind.css";

import { getSales, createSaleWithDetails } from "../services/portSales";
import { getProducts } from "../services/portProducts";

const SalePage = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [currentSale, setCurrentSale] = useState([
    { id: "", product: "", quantity: "0", sale_price: "0" },
  ]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [receivedAmount, setReceivedAmount] = useState(0); // Add state for received amount
  const [suggestions, setSuggestions] = useState([]);
  const [focusedIndex, setFocusedIndex] = useState(null);

  /*
  use effect to fetch sales and products
  */
  useEffect(() => {
    const fecthSales = async () => {
      const sales = await getSales();
      const p = await getProducts();
      setSales(sales);
      setAllProducts(p);
    };
    fecthSales();
  }, []);

  /*
  use effect to calculate total amount
  */
  useEffect(() => {
    const newTotal = currentSale.reduce(
      (acc, product) =>
        acc +
        (parseFloat(product.sale_price) || 0) *
          (parseInt(product.quantity) || 0),
      0,
    );
    setTotalAmount(newTotal);
  }, [currentSale]);

  /*
  use effect to fetch suggestions when products change
  */
  const handleChange = (index, e) => {
    const { name, value } = e.target;
    const updatedSale = [...currentSale];
    updatedSale[index][name] = value;
    setCurrentSale(updatedSale);

    if (name === "product") {
      const filteredSuggestions = allProducts.filter((producto) =>
        producto.name.toLowerCase().includes(value.toLowerCase()),
      );
      setSuggestions(filteredSuggestions);
      setFocusedIndex(index);
    }
  };

  /*
  handle suggestion click
  */
  const handleSuggestionClick = (index, suggestion) => {
    const updatedSale = [...currentSale];
    updatedSale[index].product = suggestion.name;
    updatedSale[index].sale_price = suggestion.sale_price;
    updatedSale[index].id = suggestion.id; // Add product ID
    setCurrentSale(updatedSale);
    setSuggestions([]);
    setFocusedIndex(null);
  };

  const handleAddProductField = () => {
    setCurrentSale([
      ...currentSale,
      { id: "", name: "", quantity: "0", sale_price: "0" },
    ]);
  };

  const handleRemoveProductField = (index) => {
    if (currentSale.length > 1) {
      const updatedSale = currentSale.filter((_, i) => i !== index);
      setCurrentSale(updatedSale);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newSale = currentSale.map((product) => ({
      ...product,
      id: parseInt(product.id),
      sale_price: parseFloat(product.sale_price),
      quantity: parseInt(product.quantity),
    }));

    const newTotal = newSale.reduce(
      (acc, product) => acc + product.sale_price * product.quantity,
      0,
    );

    const newDate = new Date().toISOString();

    setSales([
      ...sales,
      { products: newSale, total_amount: newTotal, sale_date: newDate },
    ]);
    setCurrentSale([{ id: "", name: "", quantity: "", sale_price: "" }]);
    setTotalAmount(0);
    setReceivedAmount(0); // Reset received amount

    console.log("venta:", newSale, newTotal, newDate);

    const productsFormat = newSale.map((product) => ({
      product_id: product.id,
      quantity: product.quantity,
    }));

    createSaleWithDetails(
      { total_amount: newTotal, sale_date: newDate },
      productsFormat,
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mt-6 border-l-4 border-green-500 pl-4">
        <h1 className="mb-4 text-3xl font-bold text-green-800">
          Registrar Venta
        </h1>

        <form
          onSubmit={handleSubmit}
          className="mb-6 rounded-lg bg-white p-6 shadow-lg"
        >
          {currentSale.map((product, index) => (
            <div
              key={index}
              className="mb-4 flex flex-wrap items-center space-x-4 rounded-lg bg-gray-50 p-4 shadow-sm"
            >
              <label className="flex-1 text-gray-700">
                Producto:
                <input
                  type="text"
                  name="product"
                  placeholder="Inserta tu producto"
                  value={product.product || ""}
                  onChange={(e) => handleChange(index, e)}
                  onFocus={() => setFocusedIndex(index)}
                  onBlur={() => setFocusedIndex(null)}
                  required
                  className="w-full rounded-lg border border-gray-300 p-2 focus:ring-2 focus:ring-green-500"
                />
                {focusedIndex === index && suggestions.length > 0 && (
                  <ul className="absolute z-10 mt-1 rounded-lg border border-gray-300 bg-white shadow-lg">
                    {suggestions.map((suggestion, idx) => (
                      <li
                        key={idx}
                        onMouseDown={() =>
                          handleSuggestionClick(index, suggestion)
                        }
                        className="cursor-pointer p-2 hover:bg-green-100"
                      >
                        {suggestion.name}
                      </li>
                    ))}
                  </ul>
                )}
              </label>
              <label className="flex-1 text-gray-700">
                Cantidad:
                <input
                  type="number"
                  name="quantity"
                  value={product.quantity || "0"}
                  onChange={(e) => handleChange(index, e)}
                  min="1"
                  required
                  className="w-full rounded-lg border border-gray-300 p-2 focus:ring-2 focus:ring-green-500"
                />
              </label>
              <label className="flex-1 text-gray-700">
                Precio de venta:
                <input
                  type="number"
                  name="sale_price"
                  value={product.sale_price || "0"}
                  readOnly
                  className="w-full rounded-lg border border-gray-300 bg-gray-100 p-2"
                />
              </label>
              {currentSale.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveProductField(index)}
                  className="ml-2 rounded-lg bg-red-600 px-4 py-2 text-white transition hover:bg-red-700"
                >
                  Eliminar
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddProductField}
            className="mr-2 rounded-lg bg-green-600 px-4 py-2 text-white shadow-md transition hover:bg-green-700"
          >
            Añadir Producto
          </button>
          <button
            type="submit"
            className="rounded-lg bg-green-600 px-4 py-2 text-white shadow-md transition hover:bg-green-700"
          >
            Registrar Venta
          </button>
        </form>

        <h2 className="mb-4 text-2xl font-bold text-green-800">
          Productos en la Venta Actual
        </h2>
        <ul className="mb-6 rounded-lg bg-white p-4 shadow-md">
          {currentSale.map((product, index) => (
            <li
              key={index}
              className="mb-2 flex justify-between border-b border-gray-200 pb-2"
            >
              <span>{product.product || "-----"}</span>
              <span>
                {product.quantity} x ${product.sale_price}
              </span>
            </li>
          ))}
        </ul>
        <div className="mb-4 mt-4 flex justify-evenly space-x-4">
          <h2 className="text-2xl font-bold text-green-800">
            Total:{" "}
            <span className="text-green-700">${totalAmount.toFixed(2)}</span>
          </h2>
          <label className="text-gray-700">
            Monto Recibido:
            <input
              type="number"
              placeholder="Inserta el monto recibido"
              onChange={(e) => setReceivedAmount(parseFloat(e.target.value))}
              className="ml-2 w-32 rounded-lg border border-gray-300 p-2 focus:ring-2 focus:ring-green-500"
              value={receivedAmount}
              min={0}
            />
          </label>
          <h2 className="text-2xl font-bold text-green-800">
            De Vuelta:{" "}
            <span className="text-green-700">
              ${(receivedAmount - totalAmount).toFixed(2) || "0.00"}
            </span>
          </h2>
        </div>
      </div>

      <div className="mt-6 border-l-4 border-green-500 pl-4">
        <h2 className="mb-4 text-2xl font-bold text-green-800">
          Historial de Ventas
        </h2>
        <table className="min-w-full rounded-lg bg-white shadow-md">
          <thead>
            <tr className="bg-green-100">
              <th className="border-b border-gray-300 px-4 py-2 text-left text-green-800">
                Productos
              </th>
              <th className="border-b border-gray-300 px-4 py-2 text-left text-green-800">
                Total
              </th>
              <th className="border-b border-gray-300 px-4 py-2 text-left text-green-800">
                Fecha
              </th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale, index) => (
              <tr key={index} className="hover:bg-green-50">
                <td className="border-b border-gray-300 px-4 py-2">
                  {sale.products.map((product, idx) => (
                    <div key={idx} className="text-gray-700">
                      {product.product} - {product.quantity} x $
                      {product.sale_price}
                    </div>
                  ))}
                </td>
                <td className="border-b border-gray-300 px-4 py-2 text-gray-800">
                  ${sale.total_amount}
                </td>
                <td className="border-b border-gray-300 px-4 py-2 text-gray-600">
                  {new Date(sale.sale_date).toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SalePage;
