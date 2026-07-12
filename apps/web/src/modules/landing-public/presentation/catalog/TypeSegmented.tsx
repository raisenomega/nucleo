import { useI18n } from "@shared/i18n";
import type { TranslationKey } from "@shared/i18n";

const OPTS: [string, TranslationKey][] = [["all", "lpCatalogTypeAll"], ["products", "lpCatalogTypeProducts"], ["services", "lpCatalogTypeServices"], ["packages", "lpCatalogTypePackages"]];

export function TypeSegmented({ active, onSelect }: { active: string; onSelect: (t: string) => void }) {
  const { t } = useI18n();
  return (
    <div role="tablist" className="inline-flex gap-1 rounded-lg border border-[color:var(--glass-border)] p-1">
      {OPTS.map(([val, key]) => (
        <button key={val} type="button" role="tab" aria-selected={active === val} onClick={() => onSelect(val)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${active === val ? "bg-[color:hsl(var(--tenant-accent-hsl))] text-white" : "text-[color:hsl(var(--lp-fg))]"}`}>{t(key)}</button>))}
    </div>
  );
}
