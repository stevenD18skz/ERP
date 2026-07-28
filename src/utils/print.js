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
  // Primera opción: usar un iframe oculto para evitar abrir una pestaña
  // nueva (evita el about:blank que algunos navegadores enfocan).
  try {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.setAttribute("aria-hidden", "true");
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        console.error("Impresión vía iframe falló:", err);
      } finally {
        setTimeout(() => {
          try {
            document.body.removeChild(iframe);
          } catch (e) {
            /* ignore */
          }
        }, 1000);
      }
    }, delay);

    return true;
  } catch (err) {
    console.error("Impresión vía iframe falló, intentando ventana:", err);
  }

  // Si el iframe falla por alguna razón, intentar abrir una nueva ventana.
  try {
    const w = window.open("", "_blank", "noopener,noreferrer");
    if (!w) return false;
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), delay);
    return true;
  } catch (err) {
    console.error("openPrintWindow fallback falló:", err);
    return false;
  }
}
