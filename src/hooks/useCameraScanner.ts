"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/*
  useCameraScanner
  - Lee códigos de barras con la cámara del aparato usando BarcodeDetector, la
    API que el propio navegador trae. Sin librerías: el motor de lectura ya
    está dentro de Chrome y bajarlo otra vez en JavaScript sería pagar dos
    veces por lo mismo.
  - Es el hermano de useBarcodeScanner, no su reemplazo. Aquel escucha el
    teclado (lector USB o la app del celular haciendo de teclado) y sigue
    siendo el camino del mostrador con computador; este es para cuando lo único
    que hay a la mano es el teléfono. Los dos entregan lo mismo —un string con
    el código— así que la pantalla que los usa no tiene que saber cuál fue.
  - Nunca prende la cámara sola: solo cuando `active` pasa a true. Y la apaga
    apenas deja de estar activo, se desmonta el componente o la pestaña se va a
    segundo plano. Una cámara encendida de más gasta batería y deja el punto
    rojo de "grabando" puesto, que asusta con razón.

  Dónde NO va a funcionar, y hay que decirlo en pantalla y no en la consola:
  - Safari de iPhone y Firefox no traen BarcodeDetector. `supported` sale false
    y quien llama debe esconder el botón de cámara.
  - getUserMedia exige conexión segura. En https y en localhost funciona; en
    http a secas (por ejemplo entrando por la IP de la red local, 192.168.x.x)
    el navegador lo bloquea de raíz.
*/

// Los de producto son los que se ven en una tienda; itf y code_128 aparecen en
// las cajas del proveedor. Se piden solo los que el aparato diga que sabe leer:
// pasarle uno que no soporta hace que el constructor tire error.
const WANTED_FORMATS = [
  "ean_13",
  "ean_8",
  "upc_a",
  "upc_e",
  "code_128",
  "itf",
  "code_39",
];

type ScannerError = {
  kind: "unsupported" | "insecure" | "denied" | "missing" | "busy" | "unknown";
  message: string;
};

/*
  El enfoque continuo y la linterna existen en Chrome de Android, pero no están
  en los tipos de cámara que trae TypeScript: pedirlos directamente no compila.
  Se declaran acá y se convierten al pedirlos, en vez de apagar el chequeo del
  resto del archivo. Si el aparato no los conoce, applyConstraints falla y cada
  llamada ya tiene su catch.
*/
type ExtraTrackConstraints = {
  advanced: Array<{ focusMode?: string; torch?: boolean }>;
};

const asTrackConstraints = (c: ExtraTrackConstraints) =>
  c as unknown as MediaTrackConstraints;

declare global {
  interface Window {
    BarcodeDetector?: {
      new (options?: { formats?: string[] }): {
        detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]>;
      };
      getSupportedFormats?: () => Promise<string[]>;
    };
  }
}

export type UseCameraScannerOptions = {
  /** Prende y apaga la cámara. */
  active: boolean;
  /** Se llama con cada código nuevo leído. */
  onScan: (code: string) => void;
  /**
   * Milisegundos que hay que esperar para volver a aceptar el MISMO código.
   * Sin esto, apuntar dos segundos a una lata la agregaría quince veces al
   * carrito: la cámara lee muchas veces por segundo, no una por gesto.
   */
  repeatDelayMs?: number;
};

export function useCameraScanner({
  active,
  onScan,
  repeatDelayMs = 2000,
}: UseCameraScannerOptions) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [ready, setReady] = useState(false);
  const [error, setError] = useState<ScannerError | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [torchAvailable, setTorchAvailable] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const lastHit = useRef<{ code: string; at: number } | null>(null);

  // onScan suele venir como función nueva en cada render; guardarla en un ref
  // evita reiniciar la cámara —con su parpadeo y su medio segundo de espera—
  // cada vez que la pantalla se redibuja.
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const stop = () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      setReady(false);
      setTorchOn(false);
      setTorchAvailable(false);
    };

    const fail = (kind: ScannerError["kind"], message: string) => {
      if (!cancelled) setError({ kind, message });
    };

    const start = async () => {
      setError(null);
      lastHit.current = null;

      if (typeof window === "undefined" || !window.BarcodeDetector) {
        fail(
          "unsupported",
          "Este navegador no sabe leer códigos con la cámara. En el teléfono, ábrelo con Chrome.",
        );
        return;
      }
      if (!window.isSecureContext) {
        fail(
          "insecure",
          "El navegador solo da acceso a la cámara en conexiones seguras (https). Entrando por la dirección de red local no se puede.",
        );
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        fail("missing", "Este aparato no expone ninguna cámara al navegador.");
        return;
      }

      // Solo los formatos que el aparato reconoce; si no sabe decirlo, se
      // intenta con la lista completa.
      let formats = WANTED_FORMATS;
      try {
        const supported = await window.BarcodeDetector.getSupportedFormats?.();
        if (supported?.length) {
          const usable = WANTED_FORMATS.filter((f) => supported.includes(f));
          if (usable.length) formats = usable;
        }
      } catch {
        /* se sigue con la lista pedida */
      }

      let detector: { detect: (s: CanvasImageSource) => Promise<{ rawValue: string }[]> };
      try {
        detector = new window.BarcodeDetector({ formats });
      } catch {
        fail(
          "unsupported",
          "Este navegador no sabe leer los códigos de barras de producto.",
        );
        return;
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          // "ideal" y no "exact": en un portátil sin cámara trasera, exact
          // fallaría en vez de usar la que hay.
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (err) {
        const name = (err as Error)?.name;
        if (name === "NotAllowedError" || name === "SecurityError") {
          fail(
            "denied",
            "No diste permiso para la cámara. Puedes darlo en el candado de la barra de direcciones y volver a intentar.",
          );
        } else if (name === "NotFoundError" || name === "OverconstrainedError") {
          fail("missing", "No se encontró ninguna cámara en este aparato.");
        } else if (name === "NotReadableError") {
          fail(
            "busy",
            "Otra aplicación está usando la cámara. Ciérrala e intenta de nuevo.",
          );
        } else {
          fail("unknown", "No se pudo abrir la cámara.");
        }
        return;
      }

      if (cancelled) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      const track = stream.getVideoTracks()[0];

      // El enfoque continuo es lo que más se nota en Android: sin él la cámara
      // se queda fija a un metro y el código de una lata en la mano sale
      // borroso. No es estándar en todos los aparatos, así que si no lo acepta
      // se sigue igual.
      try {
        await track.applyConstraints(
          asTrackConstraints({ advanced: [{ focusMode: "continuous" }] }),
        );
      } catch {
        /* el aparato no deja elegir el enfoque */
      }

      const capabilities = track.getCapabilities?.() as
        | (MediaTrackCapabilities & { torch?: boolean })
        | undefined;
      if (!cancelled && capabilities?.torch) setTorchAvailable(true);

      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      video.srcObject = stream;
      try {
        await video.play();
      } catch {
        /* algunos navegadores resuelven play() tarde; el bucle aguanta */
      }
      if (cancelled) return;
      setReady(true);

      const tick = async () => {
        if (cancelled) return;

        // readyState bajo significa que todavía no hay un cuadro que mirar;
        // pasárselo al detector tira error en vez de devolver vacío.
        if (video.readyState >= 2) {
          try {
            const found = await detector.detect(video);
            const code = found?.[0]?.rawValue?.trim();
            if (code && !cancelled) {
              const now = Date.now();
              const previous = lastHit.current;
              const isRepeat =
                previous?.code === code && now - previous.at < repeatDelayMs;
              if (!isRepeat) {
                lastHit.current = { code, at: now };
                // Un golpecito: quien escanea está mirando la mercancía, no la
                // pantalla.
                navigator.vibrate?.(60);
                onScanRef.current(code);
              }
            }
          } catch {
            /* cuadro ilegible: se intenta con el siguiente */
          }
        }

        if (!cancelled) timer = setTimeout(tick, 120);
      };

      tick();
    };

    // Con la pestaña en segundo plano la cámara sigue encendida y gastando;
    // se apaga y se vuelve a abrir al regresar.
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        stop();
      } else if (!streamRef.current) {
        cancelled = false;
        start();
      }
    };

    start();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      stop();
    };
  }, [active, repeatDelayMs]);

  const toggleTorch = useCallback(async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const next = !torchOn;
    try {
      await track.applyConstraints(
        asTrackConstraints({ advanced: [{ torch: next }] }),
      );
      setTorchOn(next);
    } catch {
      setTorchAvailable(false);
    }
  }, [torchOn]);

  return { videoRef, ready, error, torchOn, torchAvailable, toggleTorch };
}

/*
  Si conviene siquiera ofrecer el botón de cámara. Se pregunta en el cliente y
  después del montaje: en el servidor no hay navigator, y responder "sí" por
  adelantado dejaría un botón que al tocarlo solo sabe dar error.
*/
export function useCameraScannerAvailable() {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    let alive = true;

    const check = async () => {
      if (!window.BarcodeDetector) return;
      if (!window.isSecureContext) return;
      if (!navigator.mediaDevices?.enumerateDevices) return;
      try {
        // Sin permiso concedido los aparatos vienen sin nombre, pero igual
        // aparecen en la lista: alcanza para saber si hay cámara o no, y no
        // dispara el aviso de permiso.
        const devices = await navigator.mediaDevices.enumerateDevices();
        if (alive && devices.some((d) => d.kind === "videoinput")) {
          setAvailable(true);
        }
      } catch {
        /* sin lista de aparatos no se promete nada */
      }
    };

    check();
    return () => {
      alive = false;
    };
  }, []);

  return available;
}

export default useCameraScanner;
