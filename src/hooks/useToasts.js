"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { uid } from "@/utils/id";

// Avisos efímeros abajo de la pantalla. Los timers se guardan para poder
// limpiarlos al desmontar: sin eso, un setTimeout pendiente intenta actualizar
// estado de un componente que ya no existe.
export function useToasts({ duration = 4000 } = {}) {
  const timers = useRef([]);
  const [toasts, setToasts] = useState([]);

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    },
    [],
  );

  const dismiss = useCallback(
    (id) => setToasts((s) => s.filter((t) => t.id !== id)),
    [],
  );

  const push = useCallback(
    (text, type = "info", action) => {
      const id = uid();
      setToasts((s) => [...s, { id, text, type, action }]);
      timers.current.push(
        setTimeout(
          () => setToasts((s) => s.filter((t) => t.id !== id)),
          duration,
        ),
      );
      return id;
    },
    [duration],
  );

  return { toasts, push, dismiss };
}

export default useToasts;
