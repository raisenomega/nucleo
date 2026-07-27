import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import type { DashData } from "@finance/application/useDashboard.hook";
import { DashFinance } from "@finance/presentation/DashFinance";
import { DashTrend } from "@finance/presentation/DashTrend";
import { DashCommercial } from "@finance/presentation/DashCommercial";
import { DashOps } from "@finance/presentation/DashOps";
import { DashInventory } from "@finance/presentation/DashInventory";
import { DashQuickActions } from "@finance/presentation/DashQuickActions";

// Vista General (default): las 6 bandas resumidas de DASH-1 (el semáforo de salud vive ahora arriba, adaptativo).
export function DashboardGeneral({ d, gl }: { d: DashData; gl: boolean }) {
  const { t } = useI18n();
  const { can } = useModuleAccess();
  const sh = "text-xs font-bold uppercase tracking-wide text-muted-foreground";
  return (
    <div className="space-y-6">
      {(can("income", "view") || can("expenses", "view")) && <div className="space-y-3"><h2 className={sh}>{t("finance")}</h2><DashFinance d={d} glEnabled={gl} bank={d.fiscal?.bankCalculated} /></div>}
      <DashTrend trend={d.trend} />
      <div className="space-y-2"><h2 className={sh}>{t("portfolio")}</h2><DashCommercial d={d} glEnabled={gl} /></div>
      {can("routes", "view") && <div className="space-y-2"><h2 className={sh}>{t("operations")}</h2><DashOps d={d} /></div>}
      {can("inventory", "view") && d.inv && d.inv.totalItems > 0 && <div className="space-y-2"><h2 className={sh}>{t("inventory")}</h2><DashInventory d={d} /></div>}
      <div className="space-y-2"><h2 className={sh}>{t("quickActions")}</h2><DashQuickActions alerts={d.ops?.maintAlerts ?? 0} /></div>
    </div>
  );
}
