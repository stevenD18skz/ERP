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
    <div className="min-h-screen bg-green-50 p-6">
      <div className="mt-6 border-l-4 border-green-400 pl-4">
        <h1 className="mb-4 text-2xl font-bold text-green-700">
          Registrar Venta
        </h1>

        <form
          onSubmit={handleSubmit}
          className="mb-6 rounded-lg bg-white p-6 shadow-md"
        >
          {currentSale.map((product, index) => (
            <div key={index} className="mb-4 flex items-center space-x-4">
              <label className="flex-1 text-green-700">
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
                  className="w-full rounded border border-green-300 p-2"
                />
                {focusedIndex === index && suggestions.length > 0 && (
                  <ul className="absolute z-10 mt-1 rounded border border-green-300 bg-white shadow-lg">
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
              <label className="flex-1 text-green-700">
                Cantidad:
                <input
                  type="number"
                  name="quantity"
                  value={product.quantity || "0"}
                  onChange={(e) => handleChange(index, e)}
                  min="1"
                  required
                  className="w-full rounded border border-green-300 p-2"
                />
              </label>
              <label className="flex-1 text-green-700">
                Precio de venta:
                <input
                  type="number"
                  name="sale_price"
                  value={product.sale_price || "0"}
                  readOnly
                  className="w-full rounded border border-green-300 p-2"
                />
              </label>
              {currentSale.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveProductField(index)}
                  className="ml-2 rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                >
                  Eliminar
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddProductField}
            className="mr-2 rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            Añadir Producto
          </button>
          <button
            type="submit"
            className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            Registrar Venta
          </button>
        </form>

        <h2 className="mb-4 text-xl font-bold text-green-700">
          Productos en la Venta Actual
        </h2>
        <ul className="mb-6">
          {currentSale.map((product, index) => (
            <li key={index} className="mb-2">
              {product.product} - {product.quantity} x ${product.sale_price}
            </li>
          ))}
        </ul>
        <h2 className="mb-4 text-xl font-bold text-green-700">
          Total: ${totalAmount.toFixed(2)}
        </h2>
      </div>

      <div className="mt-6 border-l-4 border-green-500 pl-4">
        <h2 className="mb-4 text-xl font-bold text-green-700">
          Historial de Ventas
        </h2>
        <table className="min-w-full rounded-lg bg-white shadow-md">
          <thead>
            <tr>
              <th className="border-b border-green-300 px-4 py-2 text-left text-green-700">
                Productos
              </th>
              <th className="border-b border-green-300 px-4 py-2 text-left text-green-700">
                Total
              </th>
              <th className="border-b border-green-300 px-4 py-2 text-left text-green-700">
                Fecha
              </th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale, index) => (
              <tr key={index} className="hover:bg-green-50">
                <td className="border-b border-green-300 px-4 py-2">
                  {sale.products.map((product, idx) => (
                    <div key={idx}>
                      {product.product} - {product.quantity} x $
                      {product.sale_price} (ID: {product.id})
                    </div>
                  ))}
                </td>
                <td className="border-b border-green-300 px-4 py-2">
                  $
                  {
                    sale.total_amount //.toFixed(2)
                  }
                </td>
                <td className="border-b border-green-300 px-4 py-2">
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
