// Emparejar el celular con esta pantalla para que haga de lector de códigos.
//
// El puente es un canal de Supabase Realtime (Broadcast): pub/sub puro sobre
// WebSocket, sin tocar la base de datos. No hay tabla, ni migración, ni
// políticas de RLS de por medio; lo único que viaja es el string del código de
// barras que el celular acaba de leer.
//
// Por qué no por la red WiFi: la aplicación corre en Vercel, no en el
// computador del mostrador, así que no hay servidor local que pueda hacer de
// intermediario entre los dos navegadores. Y aunque lo hubiera, la cámara del
// celular exige conexión segura (ver el chequeo de isSecureContext en
// useCameraScanner): entrando por la dirección de red local en http, el
// navegador la bloquea de raíz. Por Realtime funciona igual desde la WiFi de
// la tienda que desde los datos del celular.
//
// El identificador del emparejamiento es un UUID aleatorio y es lo único que
// hace falta saber para entrar al canal. Por eso la página del celular puede
// ser pública: no lee ni escribe nada del negocio -solo emite el código que
// leyó- y no necesita la cookie de sesión, que de todas formas no tendría
// porque es otro navegador. Lo peor que puede pasar si alguien se hiciera con
// el identificador es que meta un código falso, y aparece en pantalla al
// instante.

// Cada lado recuerda el emparejamiento en SU navegador: el computador para no
// generar un código nuevo cada vez, y el celular para reconectarse solo
// entrando a /scan sin volver a apuntar al QR.
const HOST_KEY = "boxes.phone-scanner.host";
const CLIENT_KEY = "boxes.phone-scanner.client";
// Si alguna vez se emparejó un celular en ESTE computador. Mientras no lo haya
// habido, la pantalla no abre el canal: sería dejar una conexión permanente
// contra Supabase en cada tienda que nunca va a usar el atajo. Después de la
// primera vez sí conviene abrirlo solo, que es lo que permite levantar el
// teléfono y escanear sin abrir ningún modal antes.
const PAIRED_KEY = "boxes.phone-scanner.paired";

/** Nombre del evento de broadcast que lleva el código leído. */
export const SCAN_EVENT = "code";

/*
  El aviso que va en sentido contrario, del computador al celular: "ya puedes
  apagar la cámara".

  Hace falta porque el celular no tiene forma de saber solo cuándo terminó el
  trabajo. En Productos basta un código -se lee, se trae la ficha y lo que
  sigue es revisarla en el computador-, así que dejar la cámara encendida
  después de eso es gastar batería por nada.
*/
export const STOP_EVENT = "stop";

export type StopReason =
  /** Se leyó lo que hacía falta; no hay nada más que escanear por ahora. */
  | "done"
  /** Pasó el rato de inactividad sin leer nada. */
  | "idle";

export type StopPayload = { reason: StopReason };

/*
  Cuánto se espera sin leer nada antes de apagar la cámara y cerrar el modal.

  Los dos lados lo cuentan por su cuenta con este mismo número, en vez de que
  uno le avise al otro: si se cae la conexión, el celular igual apaga la cámara
  en vez de quedarse encendido hasta que alguien se acuerde. El aviso de arriba
  es para el otro caso, el de "ya terminamos" que solo el computador sabe.
*/
export const IDLE_TIMEOUT_MS = 60_000;

/*
  Si hay con qué armar el puente, mirando las variables de entorno y no el
  cliente ya construido.

  Importante que sea así: preguntarle a src/lib/supabaseClient obligaría a
  traer @supabase/supabase-js en el primer cargue de Ventas y de Productos, y
  son unos 66 kB que solo hacen falta si de verdad se usa el celular. Estas
  variables las reemplaza Next por su valor al compilar, así que leerlas no
  arrastra nada. El cliente se pide con import() recién al abrir el canal.
*/
export const isPhoneScannerConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export type ScanPayload = {
  /** El código de barras leído. */
  code: string;
  /**
   * Identificador de este envío. El mismo código puede leerse a propósito dos
   * veces seguidas (dos unidades del mismo producto), así que no sirve para
   * descartar repetidos; esto sí, porque es único por envío.
   */
  id: string;
};

export function channelName(pairingId: string): string {
  return `scan:${pairingId}`;
}

function randomId(): string {
  // randomUUID solo existe en contexto seguro; en el resto se arma a mano con
  // la misma fuente de aleatoriedad del navegador.
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export const newPairingId = randomId;
export const newScanId = randomId;

// localStorage tira excepción cuando el navegador tiene el almacenamiento
// bloqueado (modo privado de algunos, cookies de terceros restringidas). Sin
// memoria el emparejamiento sigue funcionando: solo hay que volver a apuntar
// al QR la próxima vez.
function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* sin memoria: se empareja de nuevo la próxima vez */
  }
}

/**
 * El emparejamiento de ESTA pantalla, creándolo la primera vez. Se guarda para
 * que el celular que ya escaneó el QR siga sirviendo mañana sin repetir el
 * trámite.
 */
export function getOrCreateHostPairingId(): string {
  const saved = read(HOST_KEY);
  if (saved) return saved;
  const fresh = newPairingId();
  write(HOST_KEY, fresh);
  return fresh;
}

/** Rompe el vínculo: el celular emparejado deja de servir y hay que rehacerlo. */
export function resetHostPairingId(): string {
  const fresh = newPairingId();
  write(HOST_KEY, fresh);
  // Y se deja de abrir el canal solo: hasta que no vuelva a emparejarse un
  // celular, no hay a quién escuchar.
  try {
    window.localStorage.removeItem(PAIRED_KEY);
  } catch {
    /* sin memoria: se reconecta al abrir el modal */
  }
  return fresh;
}

export function hasPairedPhone(): boolean {
  return read(PAIRED_KEY) === "1";
}

export function markPhonePaired(): void {
  write(PAIRED_KEY, "1");
}

/** El emparejamiento que este celular recuerda, para entrar por /scan a secas. */
export function getClientPairingId(): string | null {
  return read(CLIENT_KEY);
}

export function rememberClientPairingId(pairingId: string): void {
  write(CLIENT_KEY, pairingId);
}

/**
 * Se llama al cerrar sesión, junto con el resto de lo que queda guardado en el
 * navegador: el celular emparejado con la tienda anterior no debe seguir
 * metiendo códigos en la pantalla de la siguiente.
 */
export function clearPhoneScannerPairing(): void {
  try {
    window.localStorage.removeItem(HOST_KEY);
    window.localStorage.removeItem(CLIENT_KEY);
    window.localStorage.removeItem(PAIRED_KEY);
  } catch {
    /* nada que limpiar si no se puede leer el almacenamiento */
  }
}

/** La dirección que se pinta en el QR para que la abra el celular. */
export function pairingUrl(pairingId: string): string {
  return `${window.location.origin}/scan/${pairingId}`;
}
