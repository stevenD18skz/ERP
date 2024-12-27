import React, { useState, useEffect } from "react";

const ModalProduct = ({ product, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    price: "",
    stock: "",
    sale_price: "",
  });

  useEffect(() => {
    if (product) {
      setFormData(product);
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-800 bg-opacity-50 transition-opacity"
      role="dialog"
      aria-labelledby="modal-title"
      aria-modal="true"
    >
      <div className="relative w-full max-w-2xl scale-95 transform-gpu overflow-hidden rounded-xl bg-white shadow-xl transition-transform">
        {/* Botón de cierre */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-2 text-gray-500 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500"
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {/* Encabezado del modal */}
        <div className="border-b border-gray-200 px-6 py-4">
          <h2
            id="modal-title"
            className="text-lg font-medium leading-6 text-gray-900"
          >
            {product ? "Edit Product" : "Create Product"}
          </h2>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4 p-6" noValidate>
          {/* Campo ID (Independiente en la parte superior) */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600">
              ID:
            </label>
            <input
              type="text"
              name="id"
              value={formData.id}
              readOnly
              className="mt-1 w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-700 shadow-sm focus:outline-none"
            />
          </div>

          {/* Contenedor de 2 columnas */}
          <div className="grid grid-cols-2 gap-4">
            {/* Campo Name */}
            <div>
              <label className="block text-sm font-medium text-gray-600">
                Name:
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Campo Price */}
            <div>
              <label className="block text-sm font-medium text-gray-600">
                Price:
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Campo Stock */}
            <div>
              <label className="block text-sm font-medium text-gray-600">
                Stock:
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Campo Sale Price */}
            <div>
              <label className="block text-sm font-medium text-gray-600">
                Sale Price:
              </label>
              <input
                type="number"
                name="sale_price"
                value={formData.sale_price}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Botón de guardar */}
          <button
            type="submit"
            className="w-full rounded-md bg-green-500 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            Save
          </button>
        </form>
      </div>
    </div>
  );
};

export default ModalProduct;
