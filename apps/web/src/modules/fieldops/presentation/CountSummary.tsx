import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { formatCurrency } from "@shared/lib/format";
import type { InventoryCount } from "@fieldops/domain/inventory-count.types";

// Resumen del conteo (status >= completed). Impacto financiero = Σ(varianza × costo snapshot), gateado por inventory:cost.
export function CountSummary({ count }: { count: InventoryCount }) {
  const { t } = useI18n();
  const { can } = useModuleAccess();
  const lines = count.lines ?? [];
  const withVar = lines.filter((l) => l.variance != null && l.variance !== 0);
  const netUnits = lines.reduce((s, l) => s + (l.variance ?? 0), 0);
  const financial = lines.reduce((s, l) => s + (l.variance ?? 0) * (l.unitCostAtCount ?? 0), 0);
  const cell = (label: string, val: string, cls = "") => (
    <div className="rounded-lg border border-border bg-card p-3"><div className="text-xs font-bold text-muted-foreground">{label}</div><p className={`mt-1 font-display text-lg font-bold ${cls}`}>{val}</p></div>
  );
  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
      {cell(t("itemsCounted"), `${count.countedLines}/${count.totalLines}`)}
      {cell(t("itemsWithVariance"), String(withVar.length), withVar.length ? "text-amber-600" : "")}
      {cell(t("variance"), (netUnits > 0 ? "+" : "") + netUnits.toFixed(2), netUnits !== 0 ? "text-destructive" : "")}
      {can("inventory", "cost") && cell(t("financialImpact"), formatCurrency(financial), financial !== 0 ? "text-destructive" : "")}
    </div>
  );
}
