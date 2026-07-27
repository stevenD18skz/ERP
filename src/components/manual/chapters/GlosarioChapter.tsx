import { Type } from "lucide-react";
import { Section, SimpleTable } from "../ManualPrimitives";

export default function GlosarioChapter({ numero }: { numero: number }) {
  return (
    <Section
      id="glosario"
      icon={Type}
      numero={numero}
      titulo="Palabras del sistema"
      proposito="Las palabras que usa la aplicación, explicadas sin rodeos."
    >
      <SimpleTable
        head={["Palabra", "Qué significa"]}
        rows={[
          [
            "SKU",
            "Código interno del producto. Lo pone quien carga el producto, no viene de una autoridad externa.",
          ],
          [
            "Costo estimado",
            "Costo calculado como precio × 0,81 porque no viene de una factura. Se muestra con ~ y en gris hasta que se confirme a mano.",
          ],
          [
            "Margen",
            "Ganancia (precio menos costo) medida sobre el precio de venta, no sobre el costo.",
          ],
          ["Stock bajo", "10 unidades o menos en inventario."],
          ["Agotado", "0 unidades en inventario."],
          [
            "Cierre diario",
            "Registro de un día completo con un solo total de venta, ganancia, gasto y compra, sin el detalle de cada transacción. Es el formato que usaba el Excel.",
          ],
          [
            "Fiado",
            "Venta a crédito: no se cobró en el momento, queda pendiente a nombre de un cliente.",
          ],
          [
            "Recibido (pedido)",
            "Estado de un pedido que confirma que llegó la mercancía y suma el stock al inventario.",
          ],
          [
            "Anular (venta)",
            "Deja sin efecto una venta ya registrada y devuelve el stock vendido; no la borra, la marca como anulada.",
          ],
          [
            "Modo simulación",
            "Copia de prueba de la aplicación con datos inventados, aislada en la pestaña del navegador; no toca la información real de la tienda.",
          ],
        ]}
      />
    </Section>
  );
}
