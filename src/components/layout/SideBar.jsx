// SideBar.jsx
"use client";

import { useRouter, usePathname } from "next/navigation";
import {
  Home,
  Box,
  ShoppingCart,
  ClipboardList,
  Wallet,
  BarChart3,
  RotateCcw,
  LogOut,
} from "lucide-react";

import { useSimulation } from "@/hooks/useSimulation";
import { useSession } from "@/hooks/useSession";
import { restartSimulation, stopSimulation } from "@/lib/simulation/store";

const menuItems = [
  { path: "/dashboard", label: "Inicio", icon: Home },
  { path: "/products", label: "Productos", icon: Box },
  { path: "/sales", label: "Ventas", icon: ShoppingCart },
  { path: "/orders", label: "Pedidos", icon: ClipboardList },
  { path: "/expenses", label: "Gastos y caja", icon: Wallet },
  { path: "/summary", label: "Reportes", icon: BarChart3 },
];

// El logo, el nombre y el botón de colapsar viven en el TopBar; este
// componente solo resuelve la navegación entre secciones.
//
// La misma barra sirve para los dos tamaños, pero se comporta distinto y el
// reparto es a propósito:
//  - `isExpanded` solo manda de `md` para arriba, donde la barra siempre está y
//    lo único que cambia es si se ven las etiquetas o solo los iconos.
//  - `mobileOpen` solo manda por debajo de `md`, donde la barra entra y sale
//    deslizándose por encima de la página, siempre con las etiquetas visibles
//    (un cajón que tapa media pantalla para mostrar seis iconos sueltos no le
//    sirve a nadie).
//
// El estado se decide con clases y no en JavaScript para que no haya un salto
// al hidratar ni que un `resize` deje la barra pintada del tamaño equivocado.
const SideBar = ({ isExpanded, mobileOpen = false, onNavigate }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { active: isSimulating } = useSimulation();
  const { tienda, logout } = useSession();

  // En móvil el cajón tapa la pantalla, así que tiene que cerrarse solo apenas
  // lleva a alguna parte; en escritorio `onNavigate` no cambia nada.
  const go = (path) => {
    router.push(path);
    onNavigate?.();
  };

  // Igual que en useSimulation.ts: se recarga la página a propósito para que
  // todas las pantallas queden viendo los mismos datos reiniciados.
  const handleRestart = () => {
    restartSimulation();
    window.location.reload();
  };

  // "Salir" tiene que cerrar lo que esté abierto de verdad: si hay sesión
  // real, cerrarla en el servidor (logout ya redirige a /login); si es
  // simulación, apagarla en la pestaña y volver al inicio.
  const handleExit = () => {
    onNavigate?.();
    if (tienda) {
      logout();
      return;
    }
    if (isSimulating) stopSimulation();
    router.push("/");
  };

  return (
    <aside
      // `visibility` va en la transición junto con `transform` para que al
      // cerrar el cajón termine de salir antes de desaparecer. Sin eso se corta
      // la animación a la mitad; y sin `invisible`, los enlaces de un cajón
      // cerrado siguen recibiendo el tabulador y el lector de pantalla aunque
      // estén fuera de la vista.
      className={`fixed left-0 top-16 z-40 flex h-[calc(100dvh-4rem)] w-48 flex-col border-r border-slate-200 bg-white shadow-xl transition-[transform,width,visibility] duration-300 motion-reduce:transition-none md:visible md:translate-x-0 md:shadow-sm ${
        mobileOpen ? "visible translate-x-0" : "invisible -translate-x-full"
      } ${isExpanded ? "md:w-48" : "md:w-16"}`}
      aria-label="Navegación principal"
    >
      <nav
        className="flex flex-1 flex-col gap-1 overflow-y-auto p-2"
        aria-label="Secciones"
      >
        {menuItems.map((it) => {
          const active =
            pathname === it.path ||
            (it.path !== "/" && pathname.startsWith(it.path));
          return (
            <button
              key={it.path}
              onClick={() => go(it.path)}
              title={!isExpanded ? it.label : undefined}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-[44px] items-center justify-start gap-3 rounded-lg border-l-[3px] px-3 py-2.5 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                active
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              } ${isExpanded ? "" : "md:justify-center"}`}
            >
              <it.icon
                className={`h-[18px] w-[18px] shrink-0 ${active ? "text-blue-600" : "text-slate-400"}`}
              />
              <span
                className={`truncate text-sm font-medium ${isExpanded ? "" : "md:hidden"}`}
              >
                {it.label}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="shrink-0 space-y-1 border-t border-slate-200 p-2">
        {isSimulating && (
          <button
            type="button"
            onClick={handleRestart}
            title={!isExpanded ? "Reiniciar datos" : undefined}
            className={`flex min-h-[44px] w-full items-center justify-start gap-3 rounded-lg px-3 py-2.5 text-left text-amber-800 transition-colors duration-150 hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
              isExpanded ? "" : "md:justify-center"
            }`}
          >
            <RotateCcw className="h-[18px] w-[18px] shrink-0 text-amber-600" />
            <span
              className={`truncate text-sm font-medium ${isExpanded ? "" : "md:hidden"}`}
            >
              Reiniciar datos
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={handleExit}
          title={isSimulating ? "Salir de la simulación" : "Salir"}
          className={`flex min-h-[44px] w-full items-center justify-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            isSimulating
              ? "text-amber-800 hover:bg-amber-50"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          } ${isExpanded ? "" : "md:justify-center"}`}
        >
          <LogOut
            className={`h-[18px] w-[18px] shrink-0 ${isSimulating ? "text-amber-600" : "text-slate-400"}`}
          />
          <span
            className={`truncate text-sm font-medium ${isExpanded ? "" : "md:hidden"}`}
          >
            Salir
          </span>
        </button>
      </div>
    </aside>
  );
};

export default SideBar;
