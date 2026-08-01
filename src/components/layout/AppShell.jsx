"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import SideBar from "./SideBar";
import Footer from "./Footer";
import TopBar from "./TopBar";

// Rutas que se muestran sin el marco de la aplicación (sin barra lateral ni
// barra superior): la página pública, el manual y las pantallas de inicio de
// sesión / simulación.
const BARE_ROUTES = ["/", "/simulacion", "/login", "/signup", "/manual"];

// El celular emparejado como lector (/scan y /scan/<id>) va sin marco y por
// prefijo, no por igualdad: el identificador del emparejamiento va en la
// dirección. Ahí la pantalla entera es la cámara, y una barra lateral de
// navegación solo quitaría sitio a lo único que se hace en esa página.
const BARE_PREFIXES = ["/scan"];

const isBare = (pathname) =>
  BARE_ROUTES.includes(pathname) ||
  BARE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

// El menú tiene dos comportamientos según el tamaño de pantalla, y por eso dos
// estados separados:
//
//  - En escritorio sobra el ancho: la barra siempre está y solo cambia de
//    tamaño (48 o 16). El contenido se corre para dejarle sitio.
//  - En móvil no hay ancho que regalar. La barra no existe hasta que se pide, y
//    cuando se pide entra por encima de la página con un velo detrás. El
//    contenido no se mueve ni un píxel: lo que se desplaza es el cajón.
const AppShell = ({ children }) => {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Al pasar a escritorio la barra vuelve sola, así que el cajón tiene que
  // darse por cerrado: si no, el velo y el bloqueo del scroll se quedarían
  // puestos en una pantalla que ya no los usa.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => {
      if (mq.matches) setMobileOpen(false);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Con el cajón encima, mover el dedo tiene que mover el cajón y no la página
  // de atrás.
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  if (isBare(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen">
      <TopBar
        sidebarExpanded={sidebarExpanded}
        onToggleSidebar={() => setSidebarExpanded((s) => !s)}
        mobileOpen={mobileOpen}
        onToggleMobile={() => setMobileOpen((s) => !s)}
      />

      <div className="flex">
        {/* Velo: apaga la página de atrás y da la salida más fácil del cajón,
            que es tocar fuera. Solo existe en móvil. */}
        {mobileOpen && (
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setMobileOpen(false)}
            className="fixed inset-x-0 bottom-0 top-16 z-30 bg-slate-900/40 md:hidden"
          />
        )}

        <SideBar
          isExpanded={sidebarExpanded}
          mobileOpen={mobileOpen}
          onNavigate={() => setMobileOpen(false)}
        />

        {/* Sin padding en móvil: ahí la barra flota encima y no ocupa columna. */}
        <div
          className={`flex min-h-lvh flex-1 flex-col transition-all duration-300 ${
            sidebarExpanded ? "md:pl-48" : "md:pl-16"
          }`}
        >
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
