import type { ReactNode } from "react";
import { Trash2 } from "lucide-react";
import { useI18n } from "@shared/i18n";

// Acciones sobre un archivo ya cargado: slot "Cambiar" (un FileUploadButton) + botón "Eliminar".
// El replace va como children (es un picker real); onRemove limpia el valor.
export function FilePreviewActions({ children, onRemove, removeLabel }: {
  children: ReactNode; onRemove: () => void; removeLabel?: string;
}) {
  const { t } = useI18n();
  return (
    <div className="flex flex-wrap items-center gap-2">
      {children}
      <button type="button" onClick={onRemove}
        className="inline-flex items-center gap-1 rounded-lg border border-solid border-border px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-secondary">
        <Trash2 className="h-4 w-4" /> {removeLabel ?? t("uploadRemove")}
      </button>
    </div>
  );
}
