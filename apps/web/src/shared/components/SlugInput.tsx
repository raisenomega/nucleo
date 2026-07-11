import { useEffect, useRef } from "react";
import { useI18n } from "@shared/i18n";
import { slugify } from "@shared/lib/slugify";

// Nombre + slug auto-generado (debounce 300ms). El slug queda editable manualmente.
export function SlugInput({ name, slug, onName, onSlug }: {
  name: string; slug: string; onName: (v: string) => void; onSlug: (v: string) => void;
}) {
  const { t } = useI18n();
  const edited = useRef(false);
  useEffect(() => {
    if (edited.current) return;
    const id = setTimeout(() => onSlug(slugify(name)), 300);
    return () => clearTimeout(id);
  }, [name, onSlug]);
  const field = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  return (
    <div className="space-y-2">
      <input value={name} onChange={(e) => onName(e.target.value)} placeholder={t("name")} className={field} />
      <input value={slug} onChange={(e) => { edited.current = true; onSlug(slugify(e.target.value)); }}
        placeholder="slug" className={`${field} font-mono text-xs`} />
    </div>
  );
}
