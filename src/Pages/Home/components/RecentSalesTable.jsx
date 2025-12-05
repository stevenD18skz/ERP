import PropTypes from "prop-types";
import { currency } from "../../../utils/helpers";

const RecentSalesTable = ({ items }) => (
  <div className="overflow-auto rounded-lg bg-white p-4 shadow-sm">
    <h3 className="text-sm font-semibold text-slate-700">Ventas recientes</h3>
    <table className="mt-3 w-full text-left text-sm">
      <thead>
        <tr className="text-slate-400">
          <th className="pb-2">Fecha</th>
          <th className="pb-2">Total</th>
          <th className="pb-2">Ganancia</th>
          <th className="pb-2">Productos</th>
        </tr>
      </thead>
      <tbody>
        {items.map((s, i) => (
          <tr key={i} className="border-t border-slate-100">
            <td className="py-3 text-slate-600">
              {new Date(s.sale_date).toLocaleString()}
            </td>
            <td className="py-3 font-semibold">{currency(s.total_amount)}</td>
            <td className="py-3 text-slate-600">{currency(s.gain)}</td>
            <td className="py-3 text-slate-600">
              {s.products.map((p) => p.product).join(", ")}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
RecentSalesTable.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default RecentSalesTable;
