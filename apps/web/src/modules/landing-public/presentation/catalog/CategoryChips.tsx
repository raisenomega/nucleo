import { useI18n } from "@shared/i18n";
import type { HomeCategory } from "@landing-public/domain/landing-home.types";

const chip = (on: boolean) =>
  `shrink-0 rounded-full border px-4 py-2 text-sm font-medium ${on ? "border-[color:hsl(var(--tenant-accent-hsl))] bg-[color:hsl(var(--tenant-accent-hsl))]/20" : "border-[color:var(--glass-border)]"}`;

export function CategoryChips({ categories, active, onSelect }: {
  categories: HomeCategory[]; active: string | null; onSelect: (slug: string | null) => void;
}) {
  const { t } = useI18n();
  return (
    <div role="radiogroup" aria-label={t("lpCatalogCategoryAll")} className="flex gap-2 overflow-x-auto pb-2">
      <button type="button" role="radio" aria-checked={active === null} onClick={() => onSelect(null)} className={chip(active === null)}>{t("lpCatalogCategoryAll")}</button>
      {categories.map((c) => (
        <button key={c.id} type="button" role="radio" aria-checked={active === c.slug} onClick={() => onSelect(c.slug)} className={chip(active === c.slug)}>{c.name}</button>))}
    </div>
  );
}
