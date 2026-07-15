import { ImageUploadWithCrop } from "@shared/components/ImageUploadWithCrop";
import { useI18n } from "@shared/i18n";
import { useLandingHeroImage } from "@landing/application/useLandingHeroImage.hook";
import type { Json } from "@landing/domain/service-page-admin.types";

const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
export function HeroEditor({ hero, slug, onChange }: { hero: Json; slug: string; onChange: (h: Json) => void }) {
  const { t } = useI18n();
  const home = useLandingHeroImage(slug);
  const set = (k: string, v: unknown) => onChange({ ...hero, [k]: v });
  const inp = (k: string, ph: string) => <input value={(hero[k] as string) ?? ""} onChange={(e) => set(k, e.target.value)} placeholder={ph} className={fld} />;
  const pair = (a: string, b: string, pa: string, pb: string) => <div className="grid grid-cols-2 gap-2">{inp(a, pa)}{inp(b, pb)}</div>;
  return (
    <>
      {pair("badge_es", "badge_en", "Badge ES", "Badge EN")}
      {pair("title_es", "title_en", "Título ES", "Title EN")}
      {pair("subtitle_es", "subtitle_en", "Subtítulo ES", "Subtitle EN")}
      <div className="rounded-lg border border-border p-3">
        <span className="mb-1 block text-sm font-medium text-foreground">{t("spHeroMediaDedicated")}</span>
        <ImageUploadWithCrop entityType="service-pages" aspectRatio={4 / 3} enableVideo value={(hero.image_url as string) ?? null} onUploaded={(u) => set("image_url", u)} />
      </div>
      {home.ready && (
        <div className="rounded-lg border border-border p-3">
          <span className="block text-sm font-medium text-foreground">{t("spHeroMediaHome")}</span>
          <span className="mb-1 block text-xs text-muted-foreground">{t("spHeroMediaHomeHelp")}</span>
          <ImageUploadWithCrop entityType="landing-hero" aspectRatio={4 / 5} enableVideo value={home.imageUrl} onUploaded={(u) => void home.save(u)} />
        </div>
      )}
      {pair("image_alt_es", "image_alt_en", "Alt ES", "Alt EN")}
    </>
  );
}
