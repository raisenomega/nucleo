import { useI18n } from "@shared/i18n";
import type { TranslationKey } from "@shared/i18n";

const OPTS: { v: string; k: TranslationKey }[] = [
  { v: "", k: "ordFilterAll" }, { v: "variable", k: "variableExpense" },
  { v: "fixed", k: "fixedExpense" }, { v: "debt", k: "debtExpense" }, { v: "one_time", k: "oneTimeExpense" },
];

// Chips de filtro por expense_class (solo CEO). "" = todos. Espeja el patrón de filtros de estado en órdenes.
export function ExpenseClassChips({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-wrap gap-2">
      {OPTS.map((o) => (
        <button key={o.v} type="button" onClick={() => onChange(o.v)}
          className={`rounded-full px-3 py-1 text-xs font-bold ${value === o.v ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
          {t(o.k)}
        </button>
      ))}
    </div>
  );
}
