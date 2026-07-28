"use client";

import { useEffect, useRef, useState } from "react";

/*
  useBarcodeScanner
  - Pensado para lectores que funcionan por "keyboard emulation" / "keyboard
    wedge": una app en el celular (ej. Barcode to PC) o un lector USB físico
    que, al leer un código, lo escribe carácter por carácter como si alguien
    tecleara muy rápido y termina con Enter. El navegador no distingue esa
    fuente de un teclado real: por eso el hook no sabe ni le importa de dónde
    vienen las teclas, y funciona igual con el celular o con un lector físico
    el día que se cambie.
  - Escucha en document, en fase de captura, en vez de en un input puntual.
    Así funciona sin importar qué elemento tenga el foco en ese momento (el
    cajero puede escanear sin haber hecho clic antes en el buscador), que es
    como se espera que funcione un punto de venta. La fase de captura además
    permite que, cuando SÍ se confirma un escaneo, se pueda cancelar el Enter
    antes de que le llegue al manejador propio del campo (ver más abajo).
  - Cómo distingue un escaneo de alguien escribiendo a mano: mide el tiempo
    entre teclas. Si una tecla llega más rápido que `maxDelayMs` después de la
    anterior, se considera parte de la misma ráfaga; si tarda más, la ráfaga
    se reinicia desde esa tecla. Si al llegar Enter la ráfaga acumulada tiene
    al menos `minLength` caracteres y la propia tecla Enter llegó rápido,
    se dispara `onScan`. Si no, no se hace nada: la tecla sigue su curso
    normal, como si este hook no existiera, así que escribir a mano en
    cualquier campo no se ve afectado.
  - Por qué no se usa preventDefault en cada tecla: si se hiciera, dejaría de
    poderse escribir con el teclado en cualquier parte de la pantalla
    mientras el hook está activo. Solo se cancela la tecla Enter, y solo
    cuando ya se confirmó que fue un escaneo — así el campo que tenga el foco
    (por ejemplo el buscador de Ventas) puede seguir mostrando el código a
    medida que "se escribe", pero no dispara su propio Enter por duplicado.
*/

export type UseBarcodeScannerOptions = {
  /** Se llama con el código completo cuando se confirma un escaneo. */
  onScan: (code: string) => void;
  /** Apaga el hook por completo (por ejemplo, mientras hay un modal abierto). */
  enabled?: boolean;
  /** Caracteres mínimos para considerar algo un código y no una tecla suelta. */
  minLength?: number;
  /** Milisegundos máximos entre teclas para seguir considerándolas la misma ráfaga. */
  maxDelayMs?: number;
  /**
   * Selector de campos donde nunca se debe interpretar un escaneo, aunque la
   * velocidad lo parezca (ej. un textarea de notas donde alguien puede pegar
   * texto rápido). No hace falta tocarlo para que el buscador de Ventas
   * funcione: ahí la distinción ya la hace la velocidad.
   */
  ignoreSelector?: string;
};

const DEFAULT_IGNORE_SELECTOR = "textarea, [contenteditable='true']";

export function useBarcodeScanner({
  onScan,
  enabled = true,
  minLength = 3,
  maxDelayMs = 50,
  ignoreSelector = DEFAULT_IGNORE_SELECTOR,
}: UseBarcodeScannerOptions) {
  // Si hay una ráfaga rápida en curso (todavía sin Enter). Sirve para un
  // indicador visual opcional; no se usa para decidir si es un escaneo.
  const [scanning, setScanning] = useState(false);

  const bufferRef = useRef("");
  const lastKeyTimeRef = useRef(0);
  // Guarda la última versión de onScan sin tener que reinstalar el listener
  // cada vez que el componente que usa el hook se re-renderiza.
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    if (!enabled) return;

    const reset = () => {
      bufferRef.current = "";
      setScanning(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      // No todo lo que llega rotulado como "keydown" viene de una tecla. Cuando
      // el navegador rellena un campo con el autocompletar, no simula que
      // alguien teclee: escribe el valor de una y después dispara eventos
      // fabricados —keydown, input, change, keyup— para que la página se entere
      // del cambio. Esos keydown fabricados son eventos pelados, sin `key` ni
      // `keyCode`, así que leerles event.key.length tiraba la pantalla entera.
      // Nada sin una tecla de verdad puede ser parte de un escaneo, y además el
      // valor ya quedó puesto en el campo: se corta la ráfaga y se sigue.
      if (typeof event.key !== "string" || event.key === "") {
        reset();
        return;
      }

      // Atajos de teclado (Ctrl+C, Cmd+V, etc.): no son un escaneo, y no hay
      // que interferir con ellos.
      if (event.ctrlKey || event.metaKey || event.altKey) {
        reset();
        return;
      }

      const target = event.target;
      if (target instanceof Element && target.closest(ignoreSelector)) {
        reset();
        return;
      }

      const now = performance.now();
      const delta = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      if (event.key === "Enter") {
        const code = bufferRef.current;
        const arrivedFast = delta <= maxDelayMs;
        reset();
        if (arrivedFast && code.length >= minLength) {
          // Ya se confirmó que fue un escaneo: se cancela este Enter para
          // que el campo con foco no vuelva a procesarlo por su cuenta.
          event.preventDefault();
          onScanRef.current(code);
        }
        return;
      }

      // Solo interesan teclas de un carácter imprimible; Shift, Tab, flechas,
      // etc. no forman parte del código y no deben romper la ráfaga.
      if (event.key.length !== 1) return;

      bufferRef.current = delta > maxDelayMs ? event.key : bufferRef.current + event.key;
      setScanning(bufferRef.current.length >= minLength);
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      reset();
    };
  }, [enabled, minLength, maxDelayMs, ignoreSelector]);

  return { scanning };
}
