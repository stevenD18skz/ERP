// Página pública: la puerta de entrada.
//
// Se renderiza en el servidor (no lleva "use client") porque es solo texto y
// enlaces: entre más liviana, más rápido abre. Las secciones viven en
// components/landing y las cifras del Excel en landingData.

import LandingFooter from "@/components/landing/LandingFooter";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingHero from "@/components/landing/LandingHero";
import ManualCta from "@/components/landing/ManualCta";
import ModulesSection from "@/components/landing/ModulesSection";
import OriginSection from "@/components/landing/OriginSection";
import SimulationSection from "@/components/landing/SimulationSection";

export const metadata = {
  title: "Boxes · Everything in one box",
  description:
    "Boxes — administración para una tienda de barrio: catálogo, ventas, pedidos, gastos y reportes. Se puede probar con datos de ejemplo antes de usarlo.",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <LandingHeader />

      <main>
        <LandingHero />
        <OriginSection />
        <ModulesSection />
        <SimulationSection />
        <ManualCta />
      </main>

      <LandingFooter />
    </div>
  );
}
