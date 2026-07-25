import { useI18n } from "@shared/i18n";
import { SOURCE_META, STATUS_META, SOURCE_TYPES, STATUSES } from "@accounting/presentation/journal-ui";
import type { JournalFilters as JF, SourceType, EntryStatus } from "@accounting/domain/journal-entry.types";
import type { ChartAccount } from "@accounting/domain/chart-of-accounts.types";

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

// Barra de filtros del libro mayor: período (año/mes), origen, estado, cuenta y búsqueda.
export function JournalFilters({ filters, accounts, view, onChange }: {
  filters: JF; accounts: readonly ChartAccount[]; view: "entries" | "trial"; onChange: (f: Partial<JF>) => void;
}) {
  const { t } = useI18n();
  const years = [filters.periodYear + 1, filters.periodYear, filters.periodYear - 1, filters.periodYear - 2].filter((y, i, a) => a.indexOf(y) === i);
  const sel = "rounded-lg border border-border bg-background p-2 text-sm";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select value={filters.periodYear} onChange={(e) => onChange({ periodYear: +e.target.value })} className={sel}>{years.map((y) => <option key={y} value={y}>{y}</option>)}</select>
      <select value={filters.periodMonth ?? ""} onChange={(e) => onChange({ periodMonth: e.target.value ? +e.target.value : null })} className={sel}>
        <option value="">{t("allMonths")}</option>{MONTHS.map((m) => <option key={m} value={m}>{String(m).padStart(2, "0")}</option>)}</select>
      {view === "entries" && <>
        <select value={filters.sourceType ?? ""} onChange={(e) => onChange({ sourceType: (e.target.value || null) as SourceType | null })} className={sel}>
          <option value="">{t("allSources")}</option>{SOURCE_TYPES.map((s) => <option key={s} value={s}>{t(SOURCE_META[s].key)}</option>)}</select>
        <select value={filters.status ?? ""} onChange={(e) => onChange({ status: (e.target.value || null) as EntryStatus | null })} className={sel}>
          <option value="">{t("allStatuses")}</option>{STATUSES.map((s) => <option key={s} value={s}>{t(STATUS_META[s].key)}</option>)}</select>
        <select value={filters.accountId ?? ""} onChange={(e) => onChange({ accountId: e.target.value || null })} className={sel}>
          <option value="">{t("allAccounts")}</option>{accounts.filter((a) => !a.isHeader).map((a) => <option key={a.id} value={a.id}>{a.accountCode} · {a.accountName}</option>)}</select>
        <input value={filters.search} onChange={(e) => onChange({ search: e.target.value })} placeholder={t("search")} className={`${sel} min-w-[8rem] flex-1`} />
      </>}
    </div>
  );
}
