import type { MarketingHeroRow } from "@raisen-marketing/data/hero.types";

const F = "w-full rounded-lg border border-border bg-background p-2 text-sm text-foreground";

// Campos de texto del hero (ES/EN + CTA + scroll). `patch` viene del editor (merge parcial al estado).
export function HeroTextFields({ form, patch }: { form: MarketingHeroRow; patch: (p: Partial<MarketingHeroRow>) => void }) {
  const field = (label: string, k: keyof MarketingHeroRow, area = false) => (
    <div className="space-y-1">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {area
        ? <textarea rows={3} className={F} value={String(form[k])} onChange={(e) => patch({ [k]: e.target.value } as Partial<MarketingHeroRow>)} />
        : <input className={F} value={String(form[k])} onChange={(e) => patch({ [k]: e.target.value } as Partial<MarketingHeroRow>)} />}
    </div>
  );
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {field("Título (ES)", "titleEs")}
      {field("Título (EN)", "titleEn")}
      {field("Subtítulo (ES)", "subtitleEs", true)}
      {field("Subtítulo (EN)", "subtitleEn", true)}
      {field("CTA hero (ES)", "ctaLabelEs")}
      {field("CTA hero (EN)", "ctaLabelEn")}
      {field("CTA hero destino (href · ej. #lead-form)", "ctaHref")}
      {field("Texto del indicador scroll", "scrollText")}
      {field("CTA header (ES · ej. Solicitar demo)", "navCtaLabelEs")}
      {field("CTA header (EN · ej. Book a demo)", "navCtaLabelEn")}
      {field("CTA header destino (href · ej. /demo)", "navCtaHref")}
    </div>
  );
}
