import PropTypes from "prop-types";
import { motion } from "framer-motion";

const StatCard = ({ label, value, hint, children }) => (
  <motion.div
    whileHover={{ y: -4 }}
    className="rounded-lg bg-white p-4 shadow-sm"
  >
    <div className="text-sm font-medium text-slate-500">{label}</div>
    <div className="mt-2 flex items-baseline justify-between gap-2">
      <div className="text-2xl font-bold text-slate-800">{value}</div>
      {children}
    </div>
    {hint && <div className="mt-1 text-xs text-slate-400">{hint}</div>}
  </motion.div>
);
StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  hint: PropTypes.string.isRequired,
  children: PropTypes.node,
};

export default StatCard;
