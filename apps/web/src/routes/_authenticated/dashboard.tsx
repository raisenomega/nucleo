import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useSuperAdmin } from "@shared/hooks/useSuperAdmin";
import { PlatformDashboard } from "@admin/presentation/PlatformDashboard";
import { TrialBanner } from "@shared/components/TrialBanner";
import { OmegaCrossSellCard } from "@shared/components/OmegaCrossSellCard";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { useSession } from "@shared/providers/SessionProvider";
import { useBrand } from "@shared/providers/BrandProvider";
import { useDashboard } from "@finance/application/useDashboard.hook";
import { supabaseDashboardRepository } from "@finance/infrastructure/supabase-dashboard.repository";
import { DashHealth } from "@finance/presentation/DashHealth";
import { DashFinance } from "@finance/presentation/DashFinance";
import { DashTrend } from "@finance/presentation/DashTrend";
import { DashCommercial } from "@finance/presentation/DashCommercial";
import { DashOps } from "@finance/presentation/DashOps";
import { DashInventory } from "@finance/presentation/DashInventory";
import { DashQuickActions } from "@finance/presentation/DashQuickActions";
import { DashPeriod, type PeriodKey } from "@finance/presentation/DashPeriod";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: Dashboard });

// Centro de comando: bandas Salud → Finanzas/GL + Tendencia → Comercial → Operaciones → Inventario → Acciones.
function Dashboard() {
  const { isSuperAdmin } = useSuperAdmin();
  const { t } = useI18n();
  const { can } = useModuleAccess();
  const { session } = useSession();
  const brand = useBrand();
  const [period, setPeriod] = useState<PeriodKey>("cur");
  const month = useMemo(() => (period === "prev" ? new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1) : undefined), [period]);
  const { d, loading } = useDashboard(supabaseDashboardRepository, month);
  if (isSuperAdmin) return <PlatformDashboard />;
  if (session?.role === "servicio" && !can("dashboard", "view")) return <Navigate to="/my-route" />;
  const gl = brand.glEnabled;
  const sh = "text-xs font-bold uppercase tracking-wide text-muted-foreground";
  const rawName = brand.displayName || brand.legalName;
  const tenantName = !rawName || rawName === "Mi Negocio" ? t("yourBusiness") : rawName;
  return (
    <div className="space-y-6 p-4 md:p-8">
      <TrialBanner />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="font-display text-xl font-bold text-foreground md:text-3xl">{t("welcome")} {tenantName}</h1>
          <p className="text-xs text-muted-foreground">{session?.email} · {session?.role ?? "—"}</p></div>
        {can("dashboard", "view") && <DashPeriod value={period} onChange={setPeriod} />}
      </div>
      {!can("dashboard", "view") ? null : loading || !d ? <p className="font-body text-muted-foreground">{t("noData")}</p> : (
        <div className="space-y-6">
          <div className="space-y-2"><h2 className={sh}>{t("businessHealth")}</h2><DashHealth d={d} /></div>
          {(can("income", "view") || can("expenses", "view")) && <div className="space-y-3"><h2 className={sh}>{t("finance")}</h2><DashFinance d={d} glEnabled={gl} bank={d.fiscal?.bankCalculated} /></div>}
          <DashTrend trend={d.trend} />
          <div className="space-y-2"><h2 className={sh}>{t("portfolio")}</h2><DashCommercial d={d} glEnabled={gl} /></div>
          {can("routes", "view") && <div className="space-y-2"><h2 className={sh}>{t("operations")}</h2><DashOps d={d} /></div>}
          {can("inventory", "view") && d.inv && d.inv.totalItems > 0 && <div className="space-y-2"><h2 className={sh}>{t("inventory")}</h2><DashInventory d={d} /></div>}
          <div className="space-y-2"><h2 className={sh}>{t("quickActions")}</h2><DashQuickActions alerts={d.ops?.maintAlerts ?? 0} /></div>
        </div>
      )}
      <OmegaCrossSellCard />
    </div>
  );
}
