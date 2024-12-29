import React, { useState, useEffect, useRef } from "react";
import "tailwindcss/tailwind.css";
import { getOrders, createOrderWithDetails } from "../services/portOrders";
import { getProducts } from "../services/portProducts";

const OrdersPage = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [currentOrder, setCurrentOrder] = useState([
    { id: "", product: "", quantity: "0", price: "0" },
  ]);
  const [total, setTotal] = useState(0);
  const [suggestions, setSuggestions] = useState([]);
  const [focusedIndex, setFocusedIndex] = useState(null);
  const suggestionBoxRef = useRef(null);

  useEffect(() => {
    const fetchOrders = async () => {
      const orders = await getOrders();
      const products = await getProducts();
      setOrders(orders);
      setAllProducts(products);
    };
    fetchOrders();
  }, []);

  useEffect(() => {
    const newTotal = currentOrder.reduce(
      (acc, product) =>
        acc + (parseFloat(product.price) || 0) * (parseInt(product.quantity) || 0),
      0
    );
    setTotal(newTotal);
  }, [currentOrder]);

  const handleChange = (index, e) => {
    const { name, value } = e.target;
    const updatedOrder = [...currentOrder];
    updatedOrder[index][name] = value;
    setCurrentOrder(updatedOrder);

    if (name === "product") {
      const filteredSuggestions = allProducts.filter((producto) =>
        producto.name.toLowerCase().includes(value.toLowerCase()),
      );
      setSuggestions(filteredSuggestions);
      setFocusedIndex(index);
    }
  };

  const handleSuggestionClick = (index, suggestion) => {
    const updatedOrder = [...currentOrder];
    updatedOrder[index].product = suggestion.name;
    updatedOrder[index].price = suggestion.price;
    updatedOrder[index].id = suggestion.id; // Add product ID
    setCurrentOrder(updatedOrder);
    setSuggestions([]);
    setFocusedIndex(null);
  };

  const handleAddProductField = () => {
    setCurrentOrder([...currentOrder, { id: "", product: "", quantity: "0", price: "0" }]);
  };

  const handleRemoveProductField = (index) => {
    if (currentOrder.length > 1) {
      const updatedOrder = currentOrder.filter((_, i) => i !== index);
      setCurrentOrder(updatedOrder);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newOrder = currentOrder.map((product) => ({
      ...product,
      id: parseInt(product.id),
      price: parseFloat(product.price),
      quantity: parseInt(product.quantity),
    }));

    const newTotal = newOrder.reduce(
      (acc, product) => acc + product.price * product.quantity,
      0,
    );

    const newDate = new Date().toISOString();

    setOrders([
      ...orders,
      { products: newOrder, total_amount: newTotal, order_date: newDate },
    ]);
    setCurrentOrder([{ id: "", product: "", quantity: "0", price: "0" }]);
    setTotal(0);

    const productsFormat = newOrder.map((product) => ({
      product_id: product.id,
      quantity: product.quantity,
    }));

    createOrderWithDetails(
      { total_amount: newTotal, order_date: newDate },
      productsFormat,
    );
  };

  return (
    <div className="min-h-screen bg-purple-50 p-6">
      <div className="mt-6 border-l-4 border-purple-400 pl-4">
        <h1 className="mb-4 text-3xl font-bold text-purple-800">Registrar Orden</h1>

        <form onSubmit={handleSubmit} className="mb-6 rounded-lg bg-white p-6 shadow-lg">
          {currentOrder.map((product, index) => (
            <div key={index} className="mb-4 flex flex-wrap items-center space-x-4 rounded-lg bg-gray-50 p-4 shadow-sm relative">
              <label className="flex-1 text-purple-700">
                Producto:
                <input
                  type="text"
                  name="product"
                  placeholder="Inserta tu producto"
                  value={product.product}
                  onChange={(e) => handleChange(index, e)}
                  onFocus={() => setFocusedIndex(index)}
                  onBlur={() => setFocusedIndex(null)}
                  required
                  className="w-full rounded-lg border border-gray-300 p-2 focus:ring-2 focus:ring-purple-500"
                />
                {focusedIndex === index && suggestions.length > 0 && (
                  <ul ref={suggestionBoxRef} className="absolute z-10 mt-1 rounded-lg border border-gray-300 bg-white shadow-lg">
                    {suggestions.map((suggestion, idx) => (
                      <li
                        key={idx}
                        onMouseDown={() => handleSuggestionClick(index, suggestion)}
                        className="cursor-pointer p-2 hover:bg-purple-100"
                      >
                        {suggestion.name}
                      </li>
                    ))}
                  </ul>
                )}
              </label>
              <label className="flex-1 text-purple-700">
                Cantidad:
                <input
                  type="number"
                  name="quantity"
                  value={product.quantity}
                  onChange={(e) => handleChange(index, e)}
                  min="1"
                  required
                  className="w-full rounded-lg border border-gray-300 p-2 focus:ring-2 focus:ring-purple-500"
                />
              </label>
              <label className="flex-1 text-purple-700">
                Precio:
                <input
                  type="number"
                  name="price"
                  value={product.price}
                  readOnly
                  className="w-full rounded-lg border border-gray-300 bg-gray-100 p-2"
                />
              </label>
              {currentOrder.length > 1 && (
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
            className="mr-2 rounded-lg bg-purple-600 px-4 py-2 text-white shadow-md transition hover:bg-purple-700"
          >
            Añadir Producto
          </button>
          <button
            type="submit"
            className="rounded-lg bg-purple-600 px-4 py-2 text-white shadow-md transition hover:bg-purple-700"
          >
            Registrar Orden
          </button>
        </form>

        <h2 className="mb-4 text-2xl font-bold text-purple-800">Productos en la Orden Actual</h2>
        <ul className="mb-6 rounded-lg bg-white p-4 shadow-md">
          {currentOrder.map((product, index) => (
            <li key={index} className="mb-2 flex justify-between border-b border-gray-200 pb-2">
              <span>{product.product}</span>
              <span>{product.quantity} x ${product.price}</span>
            </li>
          ))}
        </ul>
        <h2 className="mb-4 text-2xl font-bold text-purple-800">
          Total: <span className="text-purple-700">${total.toFixed(2)}</span>
        </h2>
      </div>

      <div className="mt-6 border-l-4 border-purple-500 pl-4">
        <h2 className="mb-4 text-2xl font-bold text-purple-800">Historial de Órdenes</h2>
        <table className="min-w-full rounded-lg bg-white shadow-md">
          <thead>
            <tr className="bg-purple-100">
              <th className="border-b border-gray-300 px-4 py-2 text-left text-purple-800">Productos</th>
              <th className="border-b border-gray-300 px-4 py-2 text-left text-purple-800">Total</th>
              <th className="border-b border-gray-300 px-4 py-2 text-left text-purple-800">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, index) => (
              <tr key={index} className="hover:bg-purple-50">
                <td className="border-b border-gray-300 px-4 py-2">
                  {order.products.map((product, idx) => (
                    <div key={idx} className="text-gray-700">
                      {product.product} - {product.quantity} x ${product.price}
                    </div>
                  ))}
                </td>
                <td className="border-b border-gray-300 px-4 py-2 text-gray-800">
                  ${order.total_amount.toFixed(2)}
                </td>
                <td className="border-b border-gray-300 px-4 py-2 text-gray-600">
                  {new Date(order.order_date).toLocaleDateString("es-ES", {
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

export default OrdersPage;
