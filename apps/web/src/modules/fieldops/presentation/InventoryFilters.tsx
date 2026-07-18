import { Search } from "lucide-react";
import { useI18n } from "@shared/i18n";
import type { TranslationKey } from "@shared/i18n";

export type InvFilter = "all" | "low" | "catalog" | "nostock" | "slow" | "reorder";
const CHIPS: [InvFilter, TranslationKey][] = [["all", "filterAll"], ["low", "filterLow"], ["catalog", "filterCatalog"], ["nostock", "filterNoStock"], ["slow", "slowStock"], ["reorder", "filterReorder"]];

// FIX2 — chips de filtro + búsqueda por nombre/SKU.
export function InventoryFilters({ filter, search, onFilter, onSearch }: {
  filter: InvFilter; search: string; onFilter: (f: InvFilter) => void; onSearch: (s: string) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="flex flex-wrap items-center gap-2">
      {CHIPS.map(([v, k]) => (
        <button key={v} type="button" onClick={() => onFilter(v)}
          className={`rounded-full px-3 py-1 text-xs font-bold ${filter === v ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>{t(k)}</button>
      ))}
      <div className="relative ml-auto">
        <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input value={search} onChange={(e) => onSearch(e.target.value)} placeholder={t("search")}
          className="rounded-lg border border-border bg-background py-1.5 pl-8 pr-2 text-sm" />
      </div>
    </div>
  );
}
