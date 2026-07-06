import { useI18n } from "@shared/i18n";
import type { TranslationKey } from "@shared/i18n";

const MAP: Record<string, { cls: string; key: TranslationKey }> = {
  fixed: { cls: "text-blue-600", key: "fixedExpense" },
  variable: { cls: "text-orange-600", key: "variableExpense" },
  debt: { cls: "text-red-600", key: "debtExpense" },
  one_time: { cls: "text-muted-foreground", key: "oneTimeExpense" },
};

// Badge informativo de la clase de gasto (fixed/variable/debt/one_time). Null si sin clasificar.
export function ExpenseClassBadge({ value }: { value: string | null }) {
  const { t } = useI18n();
  const m = value ? MAP[value] : null;
  if (!m) return null;
  return <span className={`rounded border border-current px-1.5 py-0.5 text-xs font-bold ${m.cls}`}>{t(m.key)}</span>;
}
