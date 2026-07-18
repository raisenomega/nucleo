import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { monthlyInOut, valueByMonth, topConsumed, type RawMov } from "@fieldops/application/inventory-analytics";
import { ChartBars, ChartArea, ChartHBars, COLORS } from "@fieldops/presentation/InventoryCharts";
import type { InventoryItem } from "@fieldops/domain/inventory.types";

// FIX4 — dashboard agregado: consumo vs reposición (barras), valor de inventario (área), top 5 consumidos (barras horizontales).
export function InventoryDashboard({ movs, items, now }: { movs: RawMov[]; items: readonly InventoryItem[]; now: Date }) {
  const { t } = useI18n();
  const { can } = useModuleAccess();
  const io = monthlyInOut(movs, now);
  const val = valueByMonth(movs, items, now);
  const top = topConsumed(movs, items, now);
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
      <div className="space-y-1"><p className="text-xs font-bold text-muted-foreground">{t("chartConsumeRestock")}</p>
        <ChartBars data={io} bars={[{ key: "ins", name: t("movIns"), color: COLORS.G }, { key: "outs", name: t("movOuts"), color: COLORS.R }]} /></div>
      {can("inventory", "cost") && <div className="space-y-1"><p className="text-xs font-bold text-muted-foreground">{t("chartInvValue")}</p>
        <ChartArea data={val} name={t("stockValue")} /></div>}
      <div className="space-y-1"><p className="text-xs font-bold text-muted-foreground">{t("chartTopConsumed")}</p>
        <ChartHBars data={top} name={t("movOuts")} /></div>
    </div>
  );
}
