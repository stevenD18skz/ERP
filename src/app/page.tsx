// Página pública: la puerta de entrada.
//
// Se renderiza en el servidor porque es solo texto, enlaces y decoración en
// CSS: entre más liviana, más rápido abre. La única razón para tocar
// cookies() acá es esta: mirar si ya hay una cookie de sesión real (sin
// verificar la firma, eso lo hace el middleware en cada navegación) para que
// el header y el hero digan "Entra a mi tienda" en vez de "Entrar" — no se
// lee nada de la simulación, esa vive en sessionStorage y no existe en el
// servidor.
//
// Es material de promoción y está abierta a internet, así que no muestra
// información de ninguna tienda: ni ventas, ni cifras de contabilidad, ni
// nombres de dueños. Todo lo que aparece describe lo que la aplicación hace, en
// general. Las secciones viven en components/landing.

import { cookies } from "next/headers";

import { SESSION_COOKIE } from "@/lib/auth/session";
import BenefitsSection from "@/components/landing/BenefitsSection";
import FinalCta from "@/components/landing/FinalCta";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingHero from "@/components/landing/LandingHero";
import ModulesSection from "@/components/landing/ModulesSection";
import SimulationSection from "@/components/landing/SimulationSection";

export const metadata = {
  title: "Boxes · Everything in one box",
  description:
    "Boxes es el sistema de administración para tu tienda de barrio: inventario, punto de venta, pedidos a proveedores, gastos y reportes en un solo lugar. Pruébalo sin registrarte.",
};

export default async function LandingPage() {
  const cookieStore = await cookies();
  const hasSession = Boolean(cookieStore.get(SESSION_COOKIE)?.value);

  return (
    <div className="min-h-screen bg-white">
      <LandingHeader hasSession={hasSession} />

      <main>
        <LandingHero hasSession={hasSession} />
        <BenefitsSection />
        <HowItWorksSection />
        <ModulesSection />
        <SimulationSection />
        <FinalCta />
      </main>

      <LandingFooter />
    </div>
  );
}
