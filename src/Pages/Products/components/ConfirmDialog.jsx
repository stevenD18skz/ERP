import PropTypes from "prop-types";
import { motion } from "framer-motion";

function ConfirmDialog({
  title = "Confirmar",
  description = "¿Estás seguro?",
  onClose,
  onConfirm,
}) {
  return (
    <div className="z-60 fixed inset-0 flex items-center justify-center bg-black/40 px-4">
      <motion.div
        initial={{ y: 8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-sm rounded-lg bg-white p-4 shadow-lg"
      >
        <h4 className="font-semibold">{title}</h4>
        <p className="mt-2 text-sm text-slate-600">{description}</p>
        <div className="mt-4 flex items-center justify-end gap-2">
          <button onClick={onClose} className="rounded-md border px-3 py-2">
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="rounded-md bg-red-600 px-3 py-2 text-white"
          >
            Eliminar
          </button>
        </div>
      </motion.div>
    </div>
  );
}

ConfirmDialog.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};

export default ConfirmDialog;
