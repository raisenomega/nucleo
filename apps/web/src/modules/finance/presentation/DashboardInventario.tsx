import { useI18n } from "@shared/i18n";
import type { DashData } from "@finance/application/useDashboard.hook";
import { DashInventory } from "@finance/presentation/DashInventory";
import { DashPie } from "@finance/presentation/DashPie";
import { DashList } from "@finance/presentation/DashList";

// Vista profunda Inventario: KPIs + top consumidos + valor por almacén (pie) + bajo stock + lotes por vencer.
export function DashboardInventario({ d }: { d: DashData }) {
  const { t } = useI18n();
  const i = d.inv;
  if (!i) return null;
  const wh = i.byWarehouse.map((w) => ({ name: w.name, value: w.value }));
  const low = i.lowStockItems.map((x) => ({ label: x.name, sub: `mín ${x.min}`, value: `${x.stock}` }));
  const exp = i.expiringList.map((x) => ({ label: x.name, sub: x.lot, value: x.expiry.slice(0, 10) }));
  return (
    <div className="space-y-4">
      <DashInventory d={d} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DashPie title={t("inventoryByWarehouse")} data={wh} />
        <DashList title={t("lowStock")} rows={low} />
      </div>
      <DashList title={t("expiringLots")} rows={exp} />
    </div>
  );
}
