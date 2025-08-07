import { useState, useEffect, useRef } from "react";
import "tailwindcss/tailwind.css";

import { getSales, createSaleWithDetails } from "../services/sales.service";
import { getProducts } from "../services/products.service";

const SalePage = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [currentSale, setCurrentSale] = useState([
    { id: "", product: "", quantity: "0", price: "0", sale_price: "0" },
  ]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [receivedAmount, setReceivedAmount] = useState(0); // Add state for received amount
  const [suggestions, setSuggestions] = useState([]);
  const [focusedIndex, setFocusedIndex] = useState(null);
  const suggestionBoxRef = useRef(null);
  const newProductRef = useRef(null);
  const [loadingSales, setLoadingSales] = useState(true);

  const formatCurrency = (amount) => {
    return amount
      ? new Intl.NumberFormat("es-CO", {
          minimumFractionDigits: 0,
        }).format(amount)
      : "";
  };

  /*
  use effect to fetch sales and products
  */
  useEffect(() => {
    const fecthSales = async () => {
      setLoadingSales(true);
      const fecthsales = await getSales();
      setSales(fecthsales);
      setLoadingSales(false);
    };

    const fetchProducts = async () => {
      const p = await getProducts();
      setAllProducts(p);
    };

    fecthSales();
    fetchProducts();
  }, []); // Remove sales from dependency array

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
      const filteredSuggestions = allProducts.filter(
        (producto) =>
          producto.name.toLowerCase().includes(value.toLowerCase()) &&
          !currentSale.some((saleItem) => saleItem.product === producto.name),
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
    updatedSale[index].price = suggestion.price; // Add product price
    updatedSale[index].id = suggestion.id; // Add product ID
    setCurrentSale(updatedSale);
    setSuggestions([]);
    setFocusedIndex(null);
  };

  const handleAddProductField = () => {
    setCurrentSale([
      ...currentSale,
      { id: "", product: "", quantity: "0", price: "0", sale_price: "0" },
    ]);
    setTimeout(() => {
      if (newProductRef.current) {
        newProductRef.current.focus();
      }
    }, 100);
  };

  const handleRemoveProductField = (index) => {
    if (currentSale.length > 1) {
      const updatedSale = currentSale.filter((_, i) => i !== index);
      setCurrentSale(updatedSale);
    }
  };

  const handleCalculateGain = () => {
    console.log("currentSale", currentSale);
    const gain = currentSale.reduce(
      (acc, product) =>
        acc +
        (parseFloat(product.sale_price) - parseFloat(product.price)) *
          parseInt(product.quantity),
      0,
    );
    return gain;
  };

  const handleClearSale = () => {
    setCurrentSale([
      { id: "", product: "", quantity: "0", price: "0", sale_price: "0" },
    ]);
    setTotalAmount(0);
    setReceivedAmount(0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newSale = currentSale.map((product) => ({
      ...product,
      id: parseInt(product.id),
      sale_price: parseFloat(product.sale_price),
      price: parseFloat(product.price),
      quantity: parseInt(product.quantity),
    }));

    setCurrentSale([
      { id: "", product: "", quantity: "0", price: "0", sale_price: "0" },
    ]);
    setTotalAmount(0);
    setReceivedAmount(0);

    const newTotal = newSale.reduce(
      (acc, product) => acc + product.sale_price * product.quantity,
      0,
    );

    const newDate = new Date().toISOString();

    const newTotalGain = handleCalculateGain();

    const productsFormat = newSale.map((product) => ({
      product_id: product.id,
      quantity: product.quantity,
    }));

    createSaleWithDetails(
      { total_amount: newTotal, sale_date: newDate, gain: newTotalGain },
      productsFormat,
    );
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddProductField();
    }
  };

  return (
    <div className="min-h-screen rounded-3xl bg-gray-100 p-6">
      <div className="border-rounded-lg mt-6 border-l-4 border-teal-500 pl-4">
        <h1 className="mb-4 text-3xl font-bold text-teal-800">
          Registrar Venta
        </h1>

        <form
          onSubmit={handleSubmit}
          onKeyDown={handleKeyPress}
          className="mb-6 rounded-lg bg-white p-6 shadow-lg transition hover:shadow-xl"
        >
          {currentSale.map((product, index) => (
            <div
              key={index}
              className="relative mb-6 flex flex-wrap items-center space-x-4 rounded-lg bg-gray-50 p-4 shadow-sm"
            >
              <label className="flex-1 text-gray-700">
                <span className="mb-1 block font-semibold text-gray-600">
                  Producto:
                </span>
                <input
                  type="text"
                  name="product"
                  placeholder="Inserta tu producto"
                  value={product.product || ""}
                  onChange={(e) => handleChange(index, e)}
                  onFocus={() => setFocusedIndex(index)}
                  onBlur={() => setFocusedIndex(null)}
                  required
                  autoComplete="off"
                  className="w-full rounded-lg border border-gray-300 p-2 focus:border-teal-500 focus:outline-none"
                  ref={index === currentSale.length - 1 ? newProductRef : null}
                />
                {focusedIndex === index && suggestions.length > 0 && (
                  <ul
                    ref={suggestionBoxRef}
                    className="absolute z-10 mt-1 rounded-lg border border-gray-300 bg-white shadow-lg"
                  >
                    {suggestions.map((suggestion, idx) => (
                      <li
                        key={idx}
                        onMouseDown={() =>
                          handleSuggestionClick(index, suggestion)
                        }
                        className="cursor-pointer p-2 hover:bg-teal-100"
                      >
                        {suggestion.name}
                      </li>
                    ))}
                  </ul>
                )}
              </label>

              <label className="flex-1 text-gray-700">
                <span className="mb-1 block font-semibold text-gray-600">
                  Cantidad:
                </span>
                <input
                  type="number"
                  name="quantity"
                  placeholder="0.00"
                  value={parseInt(product.quantity, 10) || ""}
                  onChange={(e) => handleChange(index, e)}
                  min="1"
                  required
                  className="w-full rounded-lg border border-gray-300 p-2 focus:border-teal-500 focus:outline-none"
                />
              </label>

              <label className="flex-1 text-gray-700">
                <span className="mb-1 block font-semibold text-gray-600">
                  Precio de venta:
                </span>
                <input
                  type="number"
                  name="sale_price"
                  value={product.sale_price || "0"}
                  readOnly
                  className="w-full rounded-lg bg-gray-200 p-2"
                />
              </label>

              {currentSale.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveProductField(index)}
                  className="ml-2 rounded-lg bg-red-500 px-4 py-2 text-white shadow transition hover:bg-red-600"
                >
                  <i className="fas fa-trash"></i> Eliminar
                </button>
              )}
            </div>
          ))}

          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={handleAddProductField}
              className="rounded-lg bg-teal-600 px-4 py-2 text-white shadow-md transition hover:bg-teal-700"
            >
              <i className="fas fa-plus"></i> Añadir Producto
            </button>
            <button
              type="submit"
              className="rounded-lg bg-teal-600 px-4 py-2 text-white shadow-md transition hover:bg-teal-700"
            >
              <i className="fas fa-save"></i> Registrar Venta
            </button>
            <button
              type="button"
              onClick={handleClearSale}
              className="rounded-lg bg-red-500 px-4 py-2 text-white shadow-md transition hover:bg-red-600"
            >
              <i className="fas fa-trash"></i> Limpiar Venta
            </button>
          </div>
        </form>

        {/* Productos en la Venta Actual */}
        <h2 className="mb-4 text-2xl font-bold text-teal-800">
          Productos en la Venta Actual
        </h2>
        <ul className="mb-6 rounded-lg bg-white p-4 shadow-md">
          {currentSale.map((product, index) => (
            <li
              key={index}
              className="mb-2 flex justify-between border-b border-gray-200 pb-2 text-gray-700"
            >
              <span>{product.product || "-----"}</span>
              <span>
                {product.quantity} x ${product.sale_price}
              </span>
            </li>
          ))}
        </ul>

        {/* Resumen */}
        <div className="mb-4 mt-4 flex flex-col space-y-4 md:flex-row md:justify-between md:space-y-0">
          <div className="flex items-center space-x-4">
            <label className="flex items-center text-2xl font-bold text-teal-800">
              Monto Recibido:
              <div className="relative flex items-center">
                <span className="absolute left-3 text-gray-500">$</span>
                <input
                  type="text"
                  placeholder="0"
                  value={formatCurrency(receivedAmount)}
                  onChange={(e) => {
                    const numericValue = parseFloat(
                      e.target.value.replace(/[^\d]/g, "") || 0,
                    );
                    setReceivedAmount(numericValue);
                  }}
                  className="w-40 rounded-lg border border-gray-300 p-2 pl-8 text-right text-xl text-teal-900 focus:border-teal-500 focus:outline-none"
                />
              </div>
            </label>
          </div>

          <h2 className="text-2xl font-bold text-teal-800">
            De Vuelta:{" "}
            <span className="text-teal-700">
              ${formatCurrency(receivedAmount - totalAmount)}
            </span>
          </h2>

          <h2 className="text-2xl font-bold text-teal-800">
            Total:{" "}
            <span className="text-teal-700">
              ${formatCurrency(totalAmount)}
            </span>
          </h2>
        </div>
      </div>

      <div className="mt-6 border-l-4 border-green-500 pl-4">
        <h2 className="mb-4 text-3xl font-bold text-green-900">
          Historial de Ventas
        </h2>
        {loadingSales ? (
          <div className="text-center text-green-800">Cargando ventas...</div>
        ) : (
          <table className="min-w-full rounded-lg bg-white shadow-lg">
            <thead>
              <tr className="bg-green-100">
                <th className="border-b border-gray-300 px-4 py-2 text-left text-green-800">
                  Productos
                </th>
                <th className="border-b border-gray-300 px-4 py-2 text-left text-green-800">
                  Total
                </th>
                <th className="border-b border-gray-300 px-4 py-2 text-left text-green-800">
                  Ganancia
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
                  <td className="border-b border-gray-300 px-4 py-2 text-gray-800">
                    ${sale.gain}
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
        )}
      </div>
    </div>
  );
};

export default SalePage;
