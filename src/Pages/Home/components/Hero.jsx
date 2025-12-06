import PropTypes from "prop-types";
import { motion } from "framer-motion";
import { currency } from "@/utils/helpers";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar } from "@fortawesome/free-solid-svg-icons";
import { faFile } from "@fortawesome/free-solid-svg-icons";
import { faChartLine } from "@fortawesome/free-solid-svg-icons";

const Hero = ({ topProduct, totalSales, dailyAvg, onSignIn }) => (
  <section className="relative overflow-hidden rounded-b-3xl shadow-2xl">
    {/* Background con gradiente mejorado y patrones */}
    <div className="relative min-h-[600px] bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-8 md:p-12">
      {/* Imagen de fondo con overlay mejorado */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://theacsi.org/wp-content/uploads/2022/01/acsi-supermarket-industry-scaled.jpg"
          alt="hero background"
          className="h-full w-full object-cover opacity-[0.08]"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-transparent to-purple-900/40" />
      </div>

      {/* Decorative elements - círculos flotantes */}
      <div className="absolute right-10 top-10 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
      <div className="absolute bottom-10 left-10 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl" />

      {/* Content grid */}
      <div className="relative z-10 grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
        {/* Left side - Main content */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm"
          >
            <div className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
            <span className="text-xs font-medium text-white/90">
              Sistema en línea
            </span>
          </motion.div>

          {/* Título principal */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-4xl font-black leading-tight text-white md:text-5xl lg:text-6xl"
          >
            Control total de tu{" "}
            <span className="bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent">
              supermercado
            </span>
          </motion.h1>

          {/* Descripción */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="max-w-xl text-lg leading-relaxed text-blue-50"
          >
            Gestiona tu inventario, ventas y pedidos desde un panel moderno.
            <span className="font-semibold text-white">
              {" "}
              Decisiones inteligentes, resultados rápidos.
            </span>
          </motion.p>

          {/* Botones de acción */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex flex-wrap gap-3"
          >
            <button
              onClick={onSignIn}
              className="group relative overflow-hidden rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-blue-700 shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
            >
              <span className="relative z-10 flex items-center gap-2">
                <FontAwesomeIcon icon={faFile}/>
                Comenzar ahora
              </span>
              <div className="absolute inset-0 -z-0 bg-gradient-to-r from-blue-100 to-purple-100 opacity-0 transition-opacity group-hover:opacity-100" />
            </button>

            <a
              href="#features"
              className="group flex items-center gap-2 rounded-xl border-2 border-white/30 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:border-white/50 hover:bg-white/10"
            >
              <FontAwesomeIcon icon={faFile}/>
              Ver características
            </a>
          </motion.div>

          {/* Quick stats mini */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex items-center gap-6 pt-4"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
                <FontAwesomeIcon icon={faFile}/>
              </div>
              <div>
                <div className="text-xs text-blue-200">Productos activos</div>
                <div className="text-sm font-bold text-white">100%</div>
              </div>
            </div>

            <div className="h-8 w-px bg-white/20" />

            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/20">
                <FontAwesomeIcon icon={faFile}/>
              </div>
              <div>
                <div className="text-xs text-blue-200">Ventas del día</div>
                <div className="text-sm font-bold text-white">En tiempo real</div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Right side - Stats cards */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="space-y-4"
        >
          {/* Producto top card - glassmorphism */}
          <motion.div
            whileHover={{ y: -4, scale: 1.02 }}
            className="group rounded-2xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl transition-all hover:bg-white/15 hover:shadow-3xl"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faStar}/>
                  <span className="text-xs font-semibold uppercase tracking-wide text-yellow-300">
                    Producto estrella
                  </span>
                </div>

                <h3 className="mt-3 text-2xl font-bold text-white">
                  {topProduct}
                </h3>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-blue-200">Ventas promedio/día</span>
                    <span className="font-bold text-white">
                      {currency(dailyAvg)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg">
                <FontAwesomeIcon icon={faStar}/>
              </div>
            </div>
          </motion.div>

          {/* Ventas totales card */}
          <motion.div
            whileHover={{ y: -4, scale: 1.02 }}
            className="group rounded-2xl border border-white/20 bg-gradient-to-br from-green-500/20 to-emerald-500/20 p-6 shadow-2xl backdrop-blur-xl transition-all hover:from-green-500/30 hover:to-emerald-500/30"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-400/30">
                    <FontAwesomeIcon icon={faChartLine}/>
                  </div>
                  <span className="text-sm font-medium text-green-100">
                    Ventas totales
                  </span>
                </div>

                <p className="mt-3 text-3xl font-black text-white">
                  {currency(totalSales)}
                </p>

                <div className="mt-2 flex items-center gap-1 text-xs text-green-200">
                  <FontAwesomeIcon icon={faChartLine}/>
                  Rendimiento actual
                </div>
              </div>

              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                className="text-green-300/50"
              >
                <FontAwesomeIcon icon={faChartLine}/>
              </motion.div>
            </div>
          </motion.div>

          {/* CTA secundario */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="rounded-2xl border border-white/20 bg-white/5 p-4 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/20">
                  <FontAwesomeIcon icon={faFile}/>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    Reportes detallados
                  </p>
                  <p className="text-xs text-blue-200">Disponibles 24/7</p>
                </div>
              </div>
              <FontAwesomeIcon icon={faFile}/>
            </div>
          </motion.div>
        </motion.div>
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
