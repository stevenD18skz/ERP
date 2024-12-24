import React, { useState, useEffect } from "react";
import "tailwindcss/tailwind.css";

const productos = [
  {
    id: 1,
    nombre: "Camiseta básica",
    precio: 19.99,
    categoria: "Ropa",
    stock: 50,
    enOferta: false,
  },
  {
    id: 2,
    nombre: "Pantalón jeans",
    precio: 39.99,
    categoria: "Ropa",
    stock: 30,
    enOferta: true,
  },
  {
    id: 3,
    nombre: "Zapatillas deportivas",
    precio: 59.99,
    categoria: "Calzado",
    stock: 20,
    enOferta: false,
  },
  {
    id: 4,
    nombre: "Bolso de cuero",
    precio: 89.99,
    categoria: "Accesorios",
    stock: 15,
    enOferta: true,
  },
  {
    id: 5,
    nombre: "Reloj digital",
    precio: 49.99,
    categoria: "Tecnología",
    stock: 10,
    enOferta: false,
  },
  {
    id: 6,
    nombre: "Auriculares Bluetooth",
    precio: 29.99,
    categoria: "Tecnología",
    stock: 25,
    enOferta: true,
  },
  {
    id: 7,
    nombre: "Gorra",
    precio: 14.99,
    categoria: "Accesorios",
    stock: 40,
    enOferta: false,
  },
  {
    id: 8,
    nombre: "Camiseta edición limitada",
    precio: 24.99,
    categoria: "Ropa",
    stock: 10,
    enOferta: true,
  },
];

const SalePage = () => {
  const initialSales = [
    {
      products: [{ product: "Manzanas", quantity: 10, price: 1.5 }],
      total: 15,
    },
    { products: [{ product: "Naranjas", quantity: 5, price: 2.0 }], total: 10 },
    {
      products: [{ product: "Plátanos", quantity: 7, price: 1.2 }],
      total: 8.4,
    },
  ];
  const [sales, setSales] = useState(initialSales);
  const [currentSale, setCurrentSale] = useState([
    { product: "", quantity: "", price: "" },
  ]);
  const [total, setTotal] = useState(0);
  const [suggestions, setSuggestions] = useState([]);
  const [focusedIndex, setFocusedIndex] = useState(null);

  useEffect(() => {
    const newTotal = currentSale.reduce(
      (acc, product) => acc + (parseFloat(product.price) || 0) * (parseInt(product.quantity) || 0),
      0
    );
    setTotal(newTotal);
  }, [currentSale]);

  const handleChange = (index, e) => {
    const { name, value } = e.target;
    const updatedSale = [...currentSale];
    updatedSale[index][name] = value;
    setCurrentSale(updatedSale);

    if (name === "product") {
      const filteredSuggestions = productos.filter((producto) =>
        producto.nombre.toLowerCase().includes(value.toLowerCase()),
      );
      setSuggestions(filteredSuggestions);
      setFocusedIndex(index);
    }
  };

  const handleSuggestionClick = (index, suggestion) => {
    const updatedSale = [...currentSale];
    updatedSale[index].product = suggestion.nombre;
    updatedSale[index].price = suggestion.precio;
    setCurrentSale(updatedSale);
    setSuggestions([]);
    setFocusedIndex(null);
  };

  const handleAddProductField = () => {
    setCurrentSale([...currentSale, { product: "", quantity: "", price: "" }]);
  };

  const handleRemoveProductField = (index) => {
    if (currentSale.length > 1) {
      const updatedSale = currentSale.filter((_, i) => i !== index);
      setCurrentSale(updatedSale);
    }
  };total

  const handleSubmit = (e) => {
    e.preventDefault();
    const newSale = currentSale.map((product) => ({
      ...product,
      price: parseFloat(product.price),
      quantity: parseInt(product.quantity),
    }));
    const newTotal = newSale.reduce(
      (acc, product) => acc + product.price * product.quantity,
      0,
    );
    setSales([...sales, { products: newSale, total: newTotal }]);
    setCurrentSale([{ product: "", quantity: "", price: "" }]);
    setTotal(0);
  };

  return (
    <div className="min-h-screen bg-green-50 p-6 rounded-xl">
      <div className="mt-6 border-l-4 border-solid border-l-purple-400 pl-4">
        <h1 className="mb-4 text-2xl font-bold text-green-700">
          Registrar Venta
        </h1>

        <form
          onSubmit={handleSubmit}
          className="mb-6 rounded bg-white p-6 shadow-md"
        >
          {currentSale.map((product, index) => (
            <div key={index} className="mb-4 flex items-center justify-evenly">
              <label className="mb-2 block text-green-700">
                Producto:
                <input
                  type="text"
                  name="product"
                  value={product.product}
                  onChange={(e) => handleChange(index, e)}
                  onFocus={() => setFocusedIndex(index)}
                  onBlur={() => setFocusedIndex(null)}
                  required
                  className="w-full rounded border border-green-300 p-2"
                />
                {focusedIndex === index && suggestions.length > 0 && (
                  <ul className="absolute z-10 border border-green-300 bg-white">
                    {suggestions.map((suggestion, idx) => (
                      <li
                        key={idx}
                        onMouseDown={() =>
                          handleSuggestionClick(index, suggestion)
                        }
                        className="cursor-pointer p-2 hover:bg-green-100"
                      >
                        {suggestion.nombre}
                      </li>
                    ))}
                  </ul>
                )}
              </label>
              <label className="mb-2 block text-green-700">
                Cantidad:
                <input
                  type="number"
                  name="quantity"
                  value={product.quantity}
                  onChange={(e) => handleChange(index, e)}
                  required
                  className="w-full rounded border border-green-300 p-2"
                />
              </label>
              <label className="mb-2 block text-green-700">
                Precio:
                <input
                  type="number"
                  name="price"
                  value={product.price}
                  readOnly
                  className="w-full rounded border border-green-300 p-2"
                />
              </label>
              {currentSale.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveProductField(index)}
                  className="ml-2 rounded bg-red-700 px-4 py-2 text-white hover:bg-red-800"
                >
                  Eliminar
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddProductField}
            className="mr-2 rounded bg-blue-700 px-4 py-2 text-white hover:bg-blue-800"
          >
            Añadir Producto
          </button>
          <button
            type="submit"
            className="rounded bg-green-700 px-4 py-2 text-white hover:bg-green-800"
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
              {product.product} - {product.quantity} x ${product.price}
            </li>
          ))}
        </ul>
        <h2 className="mb-4 text-xl font-bold text-green-700">
          Total: ${total.toFixed(2)}
        </h2>
      </div>

      <div className="mt-6 border-l-4 border-solid border-l-purple-500 pl-4">
        <h2 className="mb-4 text-xl font-bold text-green-700">
          Historial de Ventas
        </h2>
        <table className="min-w-full rounded bg-white shadow-md">
          <thead>
            <tr>
              <th className="border-b border-green-300 px-4 py-2 text-left text-green-700">
                Productos
              </th>
              <th className="border-b border-green-300 px-4 py-2 text-left text-green-700">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale, index) => (
              <tr key={index} className="hover:bg-green-50">
                <td className="border-b border-green-300 px-4 py-2">
                  {sale.products.map((product, idx) => (
                    <div key={idx}>
                      {product.product} - {product.quantity} x ${product.price}
                    </div>
                  ))}
                </td>
                <td className="border-b border-green-300 px-4 py-2">
                  ${sale.total.toFixed(2)}
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
