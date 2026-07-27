// Manual de usuario.
//
// Pensado para alguien que atiende la tienda y no sabe (o se le olvidó) cómo
// se hace algo puntual: se entra por el índice o por la pregunta frecuente
// que más se le parezca, no se lee de corrido. Todo lo que dice este manual
// describe lo que la aplicación hace hoy, no lo que se planea hacer.
//
// Cada capítulo vive en components/manual/chapters y las piezas con las que
// están escritos (Callout, tablas, pasos) en ManualPrimitives.

import { ManualHeader, ManualIndex } from "@/components/manual/ManualHeader";
import ManualFaq from "@/components/manual/ManualFaq";
import QueEsChapter from "@/components/manual/chapters/QueEsChapter";
import PrimerosPasosChapter from "@/components/manual/chapters/PrimerosPasosChapter";
import ProductosChapter from "@/components/manual/chapters/ProductosChapter";
import VentasChapter from "@/components/manual/chapters/VentasChapter";
import PedidosChapter from "@/components/manual/chapters/PedidosChapter";
import GastosChapter from "@/components/manual/chapters/GastosChapter";
import ReportesChapter from "@/components/manual/chapters/ReportesChapter";
import DiaADiaChapter from "@/components/manual/chapters/DiaADiaChapter";
import ProblemasChapter from "@/components/manual/chapters/ProblemasChapter";
import GlosarioChapter from "@/components/manual/chapters/GlosarioChapter";

export const metadata = {
  title: "Manual de usuario · Boxes",
  description:
    "Para qué sirve cada sección de Boxes y cómo se hace cada tarea del día a día, con preguntas frecuentes al final.",
};

// El orden de este arreglo es el del índice (CAPITULOS en manualData): la
// numeración sale de la posición, así que agregar un capítulo en medio
// renumera el resto solo.
const CHAPTERS = [
  QueEsChapter,
  PrimerosPasosChapter,
  ProductosChapter,
  VentasChapter,
  PedidosChapter,
  GastosChapter,
  ReportesChapter,
  DiaADiaChapter,
  ProblemasChapter,
  GlosarioChapter,
];

export default function ManualPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <ManualHeader />
      <ManualIndex />

      <div className="mt-8 space-y-6">
        {CHAPTERS.map((Chapter, i) => (
          <Chapter key={i} numero={i + 1} />
        ))}
      </div>

      <ManualFaq />
    </div>
  );
}
