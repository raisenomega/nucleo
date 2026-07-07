import type { ReactNode } from "react";
import { useModalBack } from "@shared/hooks/useModalBack";

// Contenedor responsive: pantalla completa en mobile, modal centrado en desktop (md+).
// El botón "atrás" cierra este modal (no navega de página) vía useModalBack.
export function ScreenModal({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  useModalBack(onClose);
  return (
    <>
      <div className="fixed inset-0 z-[55] hidden bg-black/50 md:block" onClick={onClose} />
      <div className="fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-background md:inset-auto md:left-1/2 md:top-1/2 md:h-auto md:max-h-[90vh] md:w-full md:max-w-2xl md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-xl md:border md:border-border md:bg-card md:shadow-xl">
        {children}
      </div>
    </>
  );
}
