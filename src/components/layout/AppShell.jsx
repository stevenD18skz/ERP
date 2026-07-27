"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

import SideBar from "./SideBar";
import Footer from "./Footer";
import TopBar from "./TopBar";
import SimulationBanner from "@/components/simulation/SimulationBanner";

// Rutas que se muestran sin el marco de la aplicación (sin barra lateral ni
// barra superior): la página pública y la pantalla de paso a la simulación.
const BARE_ROUTES = ["/", "/simulacion"];

const AppShell = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();

  if (BARE_ROUTES.includes(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen">
      <TopBar
        sidebarExpanded={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((s) => !s)}
      />

      <div className="flex">
        <SideBar isExpanded={sidebarOpen} />
        <div
          className={`flex min-h-[calc(100vh-4rem)] flex-1 flex-col transition-all duration-300 ${
            sidebarOpen ? "pl-48" : "pl-16"
          }`}
        >
          {/* Debajo de la barra superior y siempre a la vista: si se está
              probando con datos falsos, no puede perderse de vista al bajar. */}
          <div className="sticky top-16 z-20">
            <SimulationBanner />
          </div>

          <main className="flex-1 bg-slate-50 px-4 py-6 md:px-8">
            {children}
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default AppShell;
