import PropTypes from "prop-types";
import { currency } from "@/utils/helpers";

const TopProducts = ({ items }) => (
  <div className="rounded-lg bg-white p-4 shadow-sm">
    <h3 className="text-sm font-semibold text-slate-700">Top productos</h3>
    <ul className="mt-3 space-y-3">
      {items.map((p) => (
        <li key={p.id} className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-slate-800">{p.name}</div>
            <div className="text-xs text-slate-400">
              {p.category} • stock {p.stock}
            </div>
          </div>
          <div className="text-sm font-semibold text-slate-700">
            {currency(p.price)}
          </div>
        </li>
      ))}
    </ul>
  </div>
);
TopProducts.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default TopProducts;
