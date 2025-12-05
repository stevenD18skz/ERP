import PropTypes from "prop-types";

const HeaderHome = ({ onSignIn }) => (
  <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-6 md:px-0">
    <div className="flex items-center gap-3">
      <img src="/vite.svg" alt="logo" className="h-10 w-10" />
      <div>
        <h1 className="text-xl font-bold text-slate-800">ERP Supermercado</h1>
        <p className="hidden text-xs text-slate-500 md:block">
          Visión rápida y control de tu tienda
        </p>
      </div>
    </div>
    <nav className="flex items-center gap-3">
      <button
        onClick={onSignIn}
        className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm hover:shadow focus:outline-none"
      >
        Iniciar sesión
      </button>
      <a
        href="#dashboard"
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
      >
        Ver Dashboard
      </a>
    </nav>
  </header>
);

HeaderHome.propTypes = {
  onSignIn: PropTypes.func.isRequired,
};

export default HeaderHome;
