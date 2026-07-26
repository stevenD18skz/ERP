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
  Settings,
} from "lucide-react";

const menuItems = [
  { path: "/", label: "Inicio", icon: Home },
  { path: "/products", label: "Productos", icon: Box },
  { path: "/sales", label: "Ventas", icon: ShoppingCart },
  { path: "/orders", label: "Pedidos", icon: ClipboardList },
  { path: "/expenses", label: "Gastos y caja", icon: Wallet },
  { path: "/summary", label: "Reportes", icon: BarChart3 },
  { path: "/settings", label: "Configuración", icon: Settings },
];

// El logo, el nombre y el botón de colapsar viven en el TopBar; este
// componente solo resuelve la navegación entre secciones.
const SideBar = ({ isExpanded }) => {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <aside
      className={`fixed left-0 top-16 z-30 h-[calc(100vh-4rem)] border-r border-slate-200 bg-white shadow-sm transition-all duration-300 ${
        isExpanded ? "w-48" : "w-16"
      }`}
      aria-label="Navegación principal"
    >
      <nav
        className="flex h-full flex-col gap-1 overflow-y-auto p-2"
        aria-label="Secciones"
      >
        {menuItems.map((it) => {
          const active =
            pathname === it.path ||
            (it.path !== "/" && pathname.startsWith(it.path));
          return (
            <button
              key={it.path}
              onClick={() => router.push(it.path)}
              title={!isExpanded ? it.label : undefined}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-[44px] items-center gap-3 rounded-lg border-l-[3px] px-3 py-2.5 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                active
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              } ${isExpanded ? "justify-start" : "justify-center"}`}
            >
              <it.icon
                className={`h-[18px] w-[18px] shrink-0 ${active ? "text-blue-600" : "text-slate-400"}`}
              />
              {isExpanded && (
                <span className="truncate text-sm font-medium">
                  {it.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default SideBar;
