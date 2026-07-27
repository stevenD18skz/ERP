// Consulta de un código de barras en los catálogos públicos.
//
// A diferencia de los demás servicios, este no pasa por dataSource: no lee ni
// escribe datos del negocio, va a preguntarle a una base de afuera cómo se
// llama el producto que acaban de escanear. Por eso tampoco cambia de
// comportamiento en modo simulación — la respuesta es la misma en los dos lados
// y no toca nada de la tienda.

/**
 * Busca la ficha pública del código.
 *
 * @returns el producto encontrado, o `null` cuando ningún catálogo lo tiene
 *          (que es un desenlace normal, no un error).
 * @throws  cuando la consulta no se pudo hacer: sin internet, código mal
 *          formado o algo roto del lado del servidor.
 */
export async function lookupBarcode(code) {
  const response = await fetch(`/api/barcode/${encodeURIComponent(code)}`, {
    headers: { Accept: "application/json" },
  });

  // El 404 es "no está en el catálogo público" y se distingue a propósito de
  // los demás errores: no hay nada que arreglar, solo hay que llenarlo a mano.
  if (response.status === 404) return null;

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      body?.error?.message || "No se pudo consultar el código de barras",
    );
  }

  return body?.data ?? null;
}
