import PropTypes from "prop-types";

const InventoryAlerts = ({ items, threshold = 10 }) => {
  const low = items.filter((p) => p.stock <= threshold);
  if (low.length === 0) return null;
  return (
    <div className="rounded-lg border-l-4 border-yellow-400 bg-yellow-50 p-4">
      <h4 className="text-sm font-semibold text-yellow-800">
        Alertas de inventario
      </h4>
      <ul className="mt-2 text-sm text-yellow-700">
        {low.map((p) => (
          <li key={p.id}>
            • {p.name} — stock: {p.stock}
          </li>
        ))}
      </ul>
    </div>
  );
};
InventoryAlerts.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object).isRequired,
  threshold: PropTypes.number,
};

export default InventoryAlerts;
