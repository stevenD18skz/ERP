import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import PropTypes from "prop-types";
import { faTimes, faSave } from "@fortawesome/free-solid-svg-icons";

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
      <div className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-xl transition-transform">
        {/* Botón de cierre */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full text-gray-500 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-400"
          aria-label="Close"
        >
          <FontAwesomeIcon icon={faTimes} className="h-5 w-5" />
        </button>

        {/* Encabezado del modal */}
        <div className="border-b border-gray-200 pb-4">
          <h2 id="modal-title" className="text-lg font-bold text-gray-800">
            {product ? "Edit Product" : "Create Product"}
          </h2>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Campo ID */}
          <div>
            <label className="block text-sm font-medium text-gray-600">
              ID:
            </label>
            <input
              type="text"
              name="id"
              value={formData.id}
              readOnly
              className="mt-1 w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm shadow-sm"
            />
          </div>

          {/* Campos en dos columnas */}
          <div className="grid grid-cols-2 gap-4">
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
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
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
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
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
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
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
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Botón de guardar */}
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <FontAwesomeIcon icon={faSave} />
            Save
          </button>
        </form>
      </div>
    </div>
  );
};

ModalProduct.propTypes = {
  product: PropTypes.object,
  onSave: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ModalProduct;
