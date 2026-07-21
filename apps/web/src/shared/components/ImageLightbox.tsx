import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

// Visor fullscreen de una imagen (evidencia de campo). Va por PORTAL a <body>: los detalles de parada viven
// dentro de ScreenModal (fixed + overflow) y un fixed anidado puede quedar recortado o debajo en móviles.
// Cierre por: botón [X] (44px, táctil), tap en el fondo, o Escape (teclado/tablet con teclado).
export function ImageLightbox({ src, onClose }: { src: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden"; // sin scroll del fondo mientras está abierto
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);
  return createPortal(
    <div role="dialog" aria-modal="true" onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-3">
      <img src={src} alt="" onClick={(e) => e.stopPropagation()}
        className="max-h-full max-w-full rounded-md object-contain" />
      <button type="button" onClick={onClose} aria-label="Cerrar"
        className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm">
        <X className="h-6 w-6" />
      </button>
    </div>,
    document.body,
  );
}
