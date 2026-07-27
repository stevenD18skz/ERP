// Impresión de recibos, órdenes y listados: se abre una ventana nueva con el
// HTML ya armado y se manda a imprimir. No se usa una librería de PDF porque el
// diálogo del navegador ya deja "Guardar como PDF" y así el resultado sale
// igual en cualquier equipo de la tienda.

// Devuelve false cuando el navegador bloqueó la ventana emergente: quien llama
// avisa al usuario con el lenguaje de su pantalla.
//
// El setTimeout antes de print() le da al navegador el respiro que necesita
// para pintar el contenido; sin él, algunas ventanas salen en blanco.
export function openPrintWindow(html, { delay = 300 } = {}) {
  const w = window.open("", "_blank", "noopener,noreferrer");
  if (!w) return false;
  w.document.write(html);
  w.document.close();
  setTimeout(() => w.print(), delay);
  return true;
}
