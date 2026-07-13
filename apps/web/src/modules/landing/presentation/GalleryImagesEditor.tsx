import { X, Plus } from "lucide-react";
import { useI18n } from "@shared/i18n";

const MAX = 5;
// Editor de fotos adicionales (lista de URLs, máx 5). Combinadas con primary_image_url en el carrusel del popup.
export function GalleryImagesEditor({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const { t } = useI18n();
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  return (
    <div>
      <span className="mb-1 block text-sm font-medium text-foreground">{t("galleryImages")}</span>
      {value.map((g, i) => (
        <div key={i} className="mb-2 flex gap-2">
          <input value={g} onChange={(e) => onChange(value.map((x, k) => (k === i ? e.target.value : x)))} placeholder="https://…" className={fld} />
          <button type="button" onClick={() => onChange(value.filter((_, k) => k !== i))} aria-label={t("delete")}><X className="h-4 w-4 text-destructive" /></button>
        </div>))}
      {value.length < MAX && <button type="button" onClick={() => onChange([...value, ""])} className="flex items-center gap-1 text-sm text-foreground"><Plus className="h-4 w-4" /> {t("galleryImages")}</button>}
    </div>
  );
}
