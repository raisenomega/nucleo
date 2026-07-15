import { ImageUploadWithCrop } from "@shared/components/ImageUploadWithCrop";
import type { Json } from "@landing/domain/service-page-admin.types";

const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
export function HeroEditor({ hero, onChange }: { hero: Json; onChange: (h: Json) => void }) {
  const set = (k: string, v: unknown) => onChange({ ...hero, [k]: v });
  const inp = (k: string, ph: string) => <input value={(hero[k] as string) ?? ""} onChange={(e) => set(k, e.target.value)} placeholder={ph} className={fld} />;
  const pair = (a: string, b: string, pa: string, pb: string) => <div className="grid grid-cols-2 gap-2">{inp(a, pa)}{inp(b, pb)}</div>;
  return (
    <>
      {pair("badge_es", "badge_en", "Badge ES", "Badge EN")}
      {pair("title_es", "title_en", "Título ES", "Title EN")}
      {pair("subtitle_es", "subtitle_en", "Subtítulo ES", "Subtitle EN")}
      <ImageUploadWithCrop entityType="service-pages" aspectRatio={4 / 3} enableVideo value={(hero.image_url as string) ?? null} onUploaded={(u) => set("image_url", u)} />
      {pair("image_alt_es", "image_alt_en", "Alt ES", "Alt EN")}
    </>
  );
}
