import { useEffect } from "react";

// Stack global de modales abiertos. El botón "atrás" (navegador/OS) cierra el modal
// superior en vez de navegar de página. Al cerrar por UI se consume la entrada empujada.
const stack: Array<() => void> = [];
let ignoreNext = false;
let attached = false;

function ensure() {
  if (attached || typeof window === "undefined") return;
  attached = true;
  window.addEventListener("popstate", () => {
    if (ignoreNext) { ignoreNext = false; return; }
    const close = stack.pop();
    if (close) close();
  });
}

export function useModalBack(onClose: () => void) {
  useEffect(() => {
    ensure();
    window.history.pushState({ modal: true }, "");
    stack.push(onClose);
    return () => {
      const i = stack.lastIndexOf(onClose);
      if (i < 0) return; // ya consumido por el botón "atrás" del navegador → no revertir.
      stack.splice(i, 1);
      // Solo revertir el pushState si SEGUIMOS en la entrada del modal (cierre por UI). Si no lo está
      // (history desincronizado, poca profundidad en landing), un back() escaparía del sitio → se omite.
      if (typeof window !== "undefined" && (window.history.state as { modal?: boolean } | null)?.modal === true) {
        ignoreNext = true; window.history.back();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
