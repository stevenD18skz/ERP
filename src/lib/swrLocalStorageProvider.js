// Caché de SWR persistida en localStorage, para que sobreviva a un F5 (recarga
// dura del navegador). Sin esto, cada reload mata el proceso de JS entero y con
// él la caché en memoria de SWR: todo se vuelve a pedir a la API aunque no haya
// pasado nada.
//
// El mapa se restaura al arrancar y se vuelve a guardar cada vez que la pestaña
// se oculta o se cierra (pagehide/visibilitychange en vez de solo beforeunload,
// que en Safari/iOS no siempre dispara).
const STORAGE_KEY = "boxes-swr-cache";

export function localStorageProvider() {
  if (typeof window === "undefined") return new Map();

  let entries = [];
  try {
    entries = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    entries = [];
  }
  const map = new Map(entries);

  const persist = () => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(Array.from(map.entries())),
      );
    } catch {
      // Cuota llena o localStorage bloqueado: se sigue funcionando solo con
      // la caché en memoria, sin persistirla.
    }
  };

  window.addEventListener("pagehide", persist);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") persist();
  });

  return map;
}

// Se llama al cerrar sesión: si no se borra, el catálogo y las ventas de esta
// tienda quedarían en el localStorage del navegador y la próxima tienda que
// inicie sesión en el mismo aparato los vería de entrada, antes de que
// cualquier pedido nuevo los reemplace (varias claves tienen
// revalidateIfStale: false, así que ni se refrescan solas).
export function clearPersistedSWRCache() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // nada que limpiar si localStorage no está disponible
  }
}
