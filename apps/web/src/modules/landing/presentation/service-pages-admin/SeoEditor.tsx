import type { Json } from "@landing/domain/service-page-admin.types";

const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
export function SeoEditor({ seo, onChange }: { seo: Json; onChange: (s: Json) => void }) {
  const set = (k: string, v: unknown) => onChange({ ...seo, [k]: v });
  const inp = (k: string, ph: string, max?: number) => (
    <div>
      <input value={(seo[k] as string) ?? ""} maxLength={max} onChange={(e) => set(k, e.target.value)} placeholder={ph} className={fld} />
      {max && <span className="text-xs text-muted-foreground">{((seo[k] as string) ?? "").length}/{max}</span>}
    </div>
  );
  return (
    <>
      <div className="grid grid-cols-2 gap-2">{inp("meta_title_es", "Meta título ES", 60)}{inp("meta_title_en", "Meta title EN", 60)}</div>
      <div className="grid grid-cols-2 gap-2">{inp("meta_description_es", "Meta desc ES", 160)}{inp("meta_description_en", "Meta desc EN", 160)}</div>
      <div className="grid grid-cols-2 gap-2">{inp("keywords_es", "Keywords ES")}{inp("keywords_en", "Keywords EN")}</div>
      {inp("og_image", "OG image URL")}
      {inp("canonical_path", "/servicios/slug")}
    </>
  );
}
