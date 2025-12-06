import PropTypes from "prop-types";
import { motion } from "framer-motion";
import { currency } from "../../../utils/helpers";

const Hero = ({ topProduct, totalSales, dailyAvg, onSignIn }) => (
  <section className="overflow-hidden rounded-b-2xl shadow-lg ">
    <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 p-6 md:p-10 min-h-[500px]">
      <img
        src="https://theacsi.org/wp-content/uploads/2022/01/acsi-supermarket-industry-scaled.jpg"
        alt="hero"
        className="absolute inset-0 h-full w-full object-cover opacity-10"
      />
      
      <div className="relative z-10 grid grid-cols-1 items-center  gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <motion.h2
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.45 }}
            className="text-3xl font-extrabold text-white md:text-4xl"
          >
            Control total de tu supermercado
          </motion.h2>
          <motion.p
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.06, duration: 0.45 }}
            className="mt-2 max-w-xl text-blue-100"
          >
            Panel minimalista con insights clave: ventas, inventario, órdenes y
            alertas. Diseño limpio, decisiones rápidas.
          </motion.p>
          <div className="mt-4 flex gap-3">
            <button
              onClick={onSignIn}
              className="rounded-md bg-white px-5 py-2 text-sm font-semibold text-blue-700 shadow transition-transform hover:translate-y-[-1px]"
            >
              Comenzar — Iniciar sesión
            </button>
            <a
              href="#features"
              className="rounded-md border border-white/30 px-4 py-2 text-sm text-white/90"
            >
              Ver características
            </a>
          </div>
        </div>

        <div className="hidden rounded-xl bg-white/10 p-4 md:block md:p-6">
          <div className="text-sm text-white/80">Producto top</div>
          <div className="mt-2 flex items-center justify-between">
            <div>
              <div className="text-lg font-bold text-white">{topProduct}</div>
              <div className="mt-1 text-xs text-white/80">
                Promedio ventas diarias: {currency(dailyAvg)}
              </div>
            </div>
            <div className="ml-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <path
                  d="M12 2v20M2 12h20"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          <div className="mt-3 text-xs text-white/70">
            Ventas totales:{" "}
            <span className="font-semibold">{currency(totalSales)}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
);

Hero.propTypes = {
  topProduct: PropTypes.string.isRequired,
  totalSales: PropTypes.number.isRequired,
  dailyAvg: PropTypes.number.isRequired,
  onSignIn: PropTypes.func.isRequired,
};

export default Hero;
