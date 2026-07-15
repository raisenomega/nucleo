import { useI18n } from "@shared/i18n";
import { HighlightsEditor } from "@landing/presentation/HighlightsEditor";
import type { ItemHighlight } from "@shared/types/item-highlight.types";

type Hero = Record<string, unknown>;
// Editor de la sección hero landing del item (landing_hero jsonb). Toggle + copy ES/EN + foto + CTAs + features.
export function LandingHeroEditor({ value, onChange }: { value: Hero | null; onChange: (v: Hero) => void }) {
  const { t } = useI18n();
  const h = value ?? {};
  const set = (k: string, v: unknown) => onChange({ ...h, [k]: v });
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  const inp = (k: string, ph: string, area = false) => area
    ? <textarea value={(h[k] as string) ?? ""} onChange={(e) => set(k, e.target.value)} placeholder={ph} rows={2} className={fld} />
    : <input value={(h[k] as string) ?? ""} onChange={(e) => set(k, e.target.value)} placeholder={ph} className={fld} />;
  const pair = (a: string, b: string, pa: string, pb: string, area = false) =>
    <div className="grid grid-cols-2 gap-2">{inp(a, pa, area)}{inp(b, pb, area)}</div>;
  return (
    <div className="space-y-2 rounded-lg border border-border p-3">
      <label className="flex items-center gap-2 text-sm font-medium text-foreground">
        <input type="checkbox" checked={h.is_enabled === true} onChange={(e) => set("is_enabled", e.target.checked)} className="h-4 w-4" />
        {t("heroSectionTitle")}
      </label>
      {h.is_enabled === true && (
        <>
          {pair("title_es", "title_en", "Título ES", "Title EN")}
          {pair("subtitle_es", "subtitle_en", "Subtítulo ES", "Subtitle EN")}
          {pair("description_es", "description_en", "Descripción ES", "Description EN", true)}
          <p className="text-xs text-muted-foreground">{t("heroMediaMovedHint")}</p>
          {pair("cta_primary_label_es", "cta_primary_label_en", "CTA 1 ES", "CTA 1 EN")}
          {pair("cta_secondary_label_es", "cta_secondary_label_en", "CTA 2 ES", "CTA 2 EN")}
          {inp("cta_secondary_target_service_slug", "slug del servicio destino (CTA 2)")}
          <HighlightsEditor value={(Array.isArray(h.features) ? h.features : []) as ItemHighlight[]} onChange={(v) => set("features", v)} />
        </>
      )}
    </div>
  );
}
