"use client";

import { useEffect, useState } from "react";

// Celular o tablet: pantalla angosta y el control principal es el dedo, no el
// mouse. Es un chequeo de APARATO, distinto de useCameraScannerAvailable (que
// revisa si el navegador de verdad sabe leer códigos con la cámara). Sirve
// para decidir qué botones mostrar -el de cámara debe verse en cualquier
// celular, aunque su navegador no traiga BarcodeDetector y termine mostrando
// el aviso de "no soportado" en vez de la imagen en vivo.
const QUERY = "(pointer: coarse) and (max-width: 1024px)";

export function useIsMobileDevice() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  return isMobile;
}

export default useIsMobileDevice;
