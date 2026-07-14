import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useModalBack } from "@shared/hooks/useModalBack";

// Bloqueo de scroll del body con contador → soporta modales anidados (solo libera al cerrar el último).
let lockCount = 0;
function useBodyScrollLock() {
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (lockCount++ === 0) document.body.style.overflow = "hidden";
    return () => { if (--lockCount === 0) document.body.style.overflow = ""; };
  }, []);
}

// Contenedor responsive: pantalla completa en mobile, modal centrado en desktop (md+). El botón "atrás" cierra este
// modal vía useModalBack. Se renderiza por Portal a document.body para escapar de ancestros con transform/overflow
// (ej. el track del carrusel) que atraparían position:fixed. Los tokens de tema viven en :root → el Portal los hereda.
export function ScreenModal({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  useModalBack(onClose);
  useBodyScrollLock();
  if (typeof document === "undefined") return null;
  return createPortal(
    <>
      <div className="fixed inset-0 z-[55] hidden bg-black/50 md:block" onClick={onClose} />
      <div role="dialog" aria-modal="true" style={{ scrollbarWidth: "thin", scrollbarColor: "hsl(var(--muted)) transparent" }}
        className="fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-background pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-muted [&::-webkit-scrollbar-track]:bg-transparent md:inset-auto md:left-1/2 md:top-1/2 md:h-auto md:max-h-[90vh] md:w-full md:max-w-2xl md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-xl md:border md:border-border md:bg-card md:pb-0 md:pt-0 md:shadow-xl">
        {children}
      </div>
    </>,
    document.body,
  );
}
