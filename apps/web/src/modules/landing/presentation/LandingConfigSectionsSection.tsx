import { useI18n, type TranslationKey } from "@shared/i18n";
import type { LandingConfig } from "@landing/domain/landing.types";

// Títulos/subtítulos custom (home + página de catálogo). Vacío → el frontend público cae al título por defecto (i18n).
type Row = [keyof LandingConfig, keyof LandingConfig, TranslationKey];
export const HOME_SECTION_ROWS: Row[] = [
  ["sectionServicesTitle", "sectionServicesSubtitle", "sectionServices"],
  ["sectionProductsTitle", "sectionProductsSubtitle", "sectionProducts"],
  ["sectionPackagesTitle", "sectionPackagesSubtitle", "sectionPackages"],
];
export const CATALOG_ROWS: Row[] = [["catalogPageTitle", "catalogPageSubtitle", "catalogPageRow"]];

export function LandingConfigSectionsSection({ c, set, rows = HOME_SECTION_ROWS }: {
  c: LandingConfig; set: (p: Partial<LandingConfig>) => void; rows?: Row[];
}) {
  const { t } = useI18n();
  const f = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  return (
    <div className="space-y-4">
      {rows.map(([tk, sk, labelKey]) => (
        <div key={tk} className="space-y-2">
          <p className="text-sm font-bold text-foreground">{t(labelKey)}</p>
          <input value={c[tk] as string} onChange={(e) => set({ [tk]: e.target.value })} placeholder={t("sectionTitlePh")} className={f} />
          <input value={c[sk] as string} onChange={(e) => set({ [sk]: e.target.value })} placeholder={t("sectionSubtitlePh")} className={f} />
          <p className="text-xs text-muted-foreground">{t("sectionTitleHelp")}</p>
        </div>
      ))}
    </div>
  );
}
