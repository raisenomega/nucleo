import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useModalBack } from "@shared/hooks/useModalBack";

// Visor de foto a pantalla completa. z-[70] (sobre modales) + cierra con el botón atrás.
export function PhotoLightbox({ src, onClose }: { src: string; onClose: () => void }) {
  const { t } = useI18n();
  useModalBack(onClose);
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4" onClick={onClose}>
      <button type="button" onClick={onClose} aria-label={t("cancel")} className="absolute right-4 top-4 text-white"><X className="h-6 w-6" /></button>
      <img src={src} alt="" className="max-h-full max-w-full object-contain" />
    </div>
  );
}
