
import PropTypes from "prop-types";
import { motion } from "framer-motion";
import { useState } from "react";
import { X } from "lucide-react";
import { products } from "../../../lib/mock";
import { useEffect } from "react";
import { currency } from "../../../utils/helpers";

function ProductForm({ initial = null, onClose, onSave }) {
  const [form, setForm] = useState(() => ({
    name: "",
    sku: "",
    price: "",
    stock: "",
    category: "",
    description: "",
    ...initial,
  }));
  const [error, setError] = useState("");

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const data = products.map((p) => p.category).filter((c, i, a) => a.indexOf(c) === i);
      setCategories(data);
    };
    fetchCategories();
  }, []);

  const submit = (e) => {
    e.preventDefault();
    if (!form.name || !form.sku)
      return setError("Nombre y SKU son obligatorios");
    if (Number(form.price) < 0 || Number(form.stock) < 0)
      return setError("Precio/Stock inválido");
    setError("");
    onSave({ ...form, price: Number(form.price), stock: Number(form.stock) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <motion.form
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onSubmit={submit}
        className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {initial ? "Editar producto" : "Nuevo producto"}
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 text-sm text-slate-500">
          Nombre, SKU y precio son importantes para facturación y búsqueda.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="text-sm">
            Nombre
            <input
              autoFocus
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
              className="mt-1 w-full rounded-md border px-3 py-2"
            />
          </label>

          <label className="text-sm">
            SKU
            <input
              value={form.sku}
              onChange={(e) => setForm((s) => ({ ...s, sku: e.target.value }))}
              className="mt-1 w-full rounded-md border px-3 py-2"
            />
          </label>

          <label className="text-sm">
            Precio
            <input
              type="number"
              value={form.price}
              onChange={(e) =>
                setForm((s) => ({ ...s, price: e.target.value }))
              }
              className="mt-1 w-full rounded-md border px-3 py-2"
            />
          </label>

          <label className="text-sm">
            Stock
            <input
              type="number"
              value={form.stock}
              onChange={(e) =>
                setForm((s) => ({ ...s, stock: e.target.value }))
              }
              className="mt-1 w-full rounded-md border px-3 py-2"
            />
          </label>

          <label className="text-sm md:col-span-2">
            Categorías
            <select
              value={form.category}
              onChange={(e) =>
                setForm((s) => ({ ...s, category: e.target.value }))
              }
              className="mt-1 w-full rounded-md border px-3 py-2"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm md:col-span-2">
            Descripción
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((s) => ({ ...s, description: e.target.value }))
              }
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              rows={3}
            />
          </label>
        </div>

        {error && <div className="mt-3 text-sm text-red-600">{error}</div>}

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border px-4 py-2"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-4 py-2 text-white"
          >
            Guardar
          </button>
        </div>
      </motion.form>
    </div>
  );
}

ProductForm.propTypes = {
  initial: PropTypes.shape({
    name: PropTypes.string,
    sku: PropTypes.string,
    price: PropTypes.number,
    stock: PropTypes.number,
    category: PropTypes.string,
    description: PropTypes.string,
  }),
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
};

export default ProductForm;
