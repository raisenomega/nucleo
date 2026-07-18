import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { monthlyInOut, cumCost, stockTrend, type RawMov } from "@fieldops/application/inventory-analytics";
import { ChartBars, ChartLine, COLORS } from "@fieldops/presentation/InventoryCharts";
import type { InventoryItem } from "@fieldops/domain/inventory.types";

// FIX5 — gráficos del detalle: entradas/salidas (barras) + stock trend (línea) + costo acumulado (línea, gateado por cost).
export function InventoryItemCharts({ item, movs, now }: { item: InventoryItem; movs: RawMov[]; now: Date }) {
  const { t } = useI18n();
  const { can } = useModuleAccess();
  const mine = movs.filter((x) => x.itemId === item.id);
  return (
    <div className="space-y-3">
      <ChartBars data={monthlyInOut(mine, now)} bars={[{ key: "ins", name: t("movIns"), color: COLORS.G }, { key: "outs", name: t("movOuts"), color: COLORS.R }]} />
      <ChartLine data={stockTrend(movs, item.id, item.stock, now)} lines={[{ key: "stock", name: t("chartStockTrend"), color: COLORS.B }]} />
      {can("inventory", "cost") && <ChartLine data={cumCost(movs, item.id, now)} lines={[{ key: "cost", name: t("chartCumCost"), color: COLORS.G }]} />}
    </div>
  );
}
