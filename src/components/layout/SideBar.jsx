// SidebarEnhanced.jsx
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
  Menu,
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

const SidebarEnhanced = ({ isExpanded, onToggle }) => {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <aside
      className={`fixed left-0 top-0 z-40 h-full border-r border-slate-200 bg-white text-slate-700 shadow-sm transition-all duration-300 ${isExpanded ? "w-64" : "w-16"
        }`}
      aria-label="Barra lateral principal"
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-center space-x-3 border-b border-slate-100">
        <button
          onClick={onToggle}
          aria-label={isExpanded ? "Colapsar menú" : "Expandir menú"}
          className={`shrink-0 rounded-md text-slate-600 hover:bg-slate-100 focus:outline-none ${!isExpanded ? "mx-auto" : ""}`}
        >
          <Menu className="h-4 w-4" />
        </button>
        {isExpanded && (
          <div className="flex min-w-0 items-center gap-3">
            <img
              src="/logo.png"
              alt="Logo"
              className="h-9 w-9 shrink-0 rounded-full object-cover"
            />
            <span className="truncate text-sm font-semibold text-slate-800">
              ERP Supermarket
            </span>
          </div>
        )}

      </div>

      {/* Menu */}
      <nav className="mt-3" aria-label="Navegación principal">
        <ul className="space-y-1">
          {menuItems.map((it) => {
            const active =
              pathname === it.path ||
              (it.path !== "/" && pathname.startsWith(it.path));
            return (
              <li key={it.path}>
                <button
                  onClick={() => router.push(it.path)}
                  title={!isExpanded ? it.label : undefined} // tooltip when collapsed
                  className={`mx-2 mb-1 flex w-[calc(100%-1rem)] items-center gap-3 rounded-md border-l-2 px-3 py-2 text-left transition-colors duration-150 ${active
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    } ${isExpanded ? "justify-start" : "justify-center"}`}
                  aria-current={active ? "page" : undefined}
                >
                  <it.icon
                    className={`h-4 w-4 ${active ? "text-blue-600" : "text-slate-400"}`}
                  />
                  {isExpanded && (
                    <span className="text-sm font-medium">{it.label}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer pequeño en sidebar (version) */}
      <div className="absolute bottom-0 w-full border-t border-slate-100 px-3 py-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          {isExpanded ? (
            <>
              <span>v1.0 • ERP</span>
              <span className="hidden md:inline">soporte@erp.local</span>
            </>
          ) : (
            <span className="mx-auto text-center">v1.0</span>
          )}
        </div>
      </div>
    </aside>
  );
};

export default SidebarEnhanced;
