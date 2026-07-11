import { useRef } from "react";
import { Video, Image as ImageIcon, Paperclip, Loader2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useI18n } from "@shared/i18n";

// Trigger de subida con estilo del design system (reemplaza el <input type=file> nativo).
// Input oculto con sr-only (accesible), botón dispara input.click(). Icono/label auto según accept.
export function FileUploadButton({ accept, onFileSelect, disabled, label, icon, variant = "default", loading }: {
  accept: string; onFileSelect: (file: File) => void; disabled?: boolean; label?: string;
  icon?: LucideIcon; variant?: "default" | "compact"; loading?: boolean;
}) {
  const { t } = useI18n();
  const ref = useRef<HTMLInputElement>(null);
  const isVideo = accept.includes("video"), isImage = accept.includes("image");
  const Icon = icon ?? (isVideo ? Video : isImage ? ImageIcon : Paperclip);
  const text = label ?? (isVideo ? t("uploadSelectVideo") : isImage ? t("uploadSelectImage") : t("uploadSelectFile"));
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) onFileSelect(f); e.target.value = ""; };
  return (
    <>
      <button type="button" disabled={disabled || loading} onClick={() => ref.current?.click()}
        className="inline-flex items-center gap-2 rounded-lg border border-solid border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
        {variant !== "compact" && <span>{loading ? t("uploadUploading") : text}</span>}
      </button>
      <input ref={ref} type="file" accept={accept} onChange={onChange} aria-label={text} className="sr-only" />
    </>
  );
}
