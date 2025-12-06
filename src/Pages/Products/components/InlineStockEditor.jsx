
import PropTypes from "prop-types";
import { useEffect, useState } from "react";


function InlineStockEditor({ value, onSave }) {
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  return (
    <div className="flex items-center gap-2">
      {editing ? (
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={v}
            onChange={(e) => setV(Number(e.target.value))}
            className="w-20 rounded-md border px-2 py-1 text-sm"
          />
          <button
            onClick={() => {
              setEditing(false);
              onSave(v);
            }}
            className="rounded-md border px-2 py-1 text-sm"
          >
            OK
          </button>
          <button
            onClick={() => {
              setEditing(false);
              setV(value);
            }}
            className="rounded-md px-2 py-1 text-sm"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className={`rounded-md px-2 py-1 text-sm ${value <= 5 ? "bg-red-50 text-red-700" : ""}`}
        >
          {value}
        </button>
      )}
    </div>
  );
}
InlineStockEditor.propTypes = {
  value: PropTypes.number.isRequired,
  onSave: PropTypes.func.isRequired,
};

export default InlineStockEditor;
