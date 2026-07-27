import { HelpCircle } from "lucide-react";
import { Section, SimpleTable } from "../ManualPrimitives";

export default function ProblemasChapter({ numero }: { numero: number }) {
  return (
    <Section
      id="problemas"
      icon={HelpCircle}
      numero={numero}
      titulo="Problemas comunes"
      proposito="Qué significa cada aviso que puede aparecer, y qué hacer."
    >
      <SimpleTable
        head={["Aviso", "Qué significa / qué hacer"]}
        rows={[
          [
            '"Ya existe un cierre para esa fecha"',
            "Ese día ya se cerró antes. Revisa el historial de Cierre del día para verlo, en vez de crear uno nuevo.",
          ],
          [
            '"Agrega al menos un producto"',
            "Se intentó registrar una venta o un pedido sin ninguna línea agregada.",
          ],
          [
            '"El monto recibido debe cubrir el total"',
            "En una venta en efectivo, el monto recibido es menor que el total a cobrar.",
          ],
          [
            '"Sin stock disponible para agregar" / "Sin más stock disponible"',
            "Se intentó vender más unidades de las que hay en inventario para ese producto.",
          ],
          [
            '"El nombre es obligatorio" / "El SKU es obligatorio"',
            "Faltan datos obligatorios al guardar un producto.",
          ],
          [
            'Fila con error al importar ("Falta el nombre", "Precio inválido", etc.)',
            "Esa fila del CSV no se va a importar. Se corrige en el archivo y se vuelve a intentar; el resto de filas válidas no se pierden.",
          ],
          [
            '"Permite las ventanas emergentes para..."',
            "El navegador bloqueó la ventana de impresión o del PDF. Hay que permitir las ventanas emergentes para este sitio e intentar de nuevo.",
          ],
          [
            "Un botón de Deshacer aparece un momento y luego desaparece",
            "Es normal: después de borrar algo hay unos segundos para deshacerlo antes de que quede confirmado.",
          ],
        ]}
      />
    </Section>
  );
}
