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
import { rpcErr } from "@finance/presentation/rpc-error";
import { useDashboard } from "@finance/application/useDashboard.hook";
import { supabaseDashboardRepository } from "@finance/infrastructure/supabase-dashboard.repository";
import { healthOf, type DashView } from "@finance/application/dash-health";
import { DashboardChips } from "@finance/presentation/DashboardChips";
import { DashboardHealth } from "@finance/presentation/DashboardHealth";
import { DashPeriod, type PeriodKey } from "@finance/presentation/DashPeriod";
import { DashboardGeneral } from "@finance/presentation/DashboardGeneral";
import { DashboardFinanzas } from "@finance/presentation/DashboardFinanzas";
import { DashboardOperaciones } from "@finance/presentation/DashboardOperaciones";
import { DashboardCartera } from "@finance/presentation/DashboardCartera";
import { DashboardInventario } from "@finance/presentation/DashboardInventario";
import { DashboardComercial } from "@finance/presentation/DashboardComercial";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: Dashboard });

// Centro de comando con chips de navegación + un semáforo único adaptativo. General = las 6 bandas resumidas.
function Dashboard() {
  const { isSuperAdmin } = useSuperAdmin();
  const { t } = useI18n();
  const { can } = useModuleAccess();
  const { session } = useSession();
  const brand = useBrand();
  const [view, setView] = useState<DashView>("general");
  const [period, setPeriod] = useState<PeriodKey>("cur");
  const month = useMemo(() => (period === "prev" ? new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1) : undefined), [period]);
  const { d, loading, errors } = useDashboard(supabaseDashboardRepository, month);
  if (isSuperAdmin) return <PlatformDashboard />;
  if (session?.role === "servicio" && !can("dashboard", "view")) return <Navigate to="/my-route" />;
  const gl = brand.glEnabled;
  const views: DashView[] = ["general"];
  if (can("income", "view") || can("expenses", "view")) views.push("finanzas");
  if (can("routes", "view")) views.push("operaciones");
  views.push("cartera");
  if (can("inventory", "view") && (d?.inv?.totalItems ?? 0) > 0) views.push("inventario");
  if (can("leads", "view")) views.push("comercial");
  const active: DashView = views.includes(view) ? view : "general";
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
      {errors.length > 0 && <p className="text-sm text-destructive">{rpcErr(errors[0] ?? "", t)}{errors.length > 1 ? ` (+${errors.length - 1})` : ""}</p>}
      {!can("dashboard", "view") ? null : loading || !d ? <p className="font-body text-muted-foreground">{t("noData")}</p> : (
        <div className="space-y-4">
          <DashboardHealth level={healthOf(active, d)} />
          <DashboardChips views={views} active={active} onChange={setView} />
          {active === "general" && <DashboardGeneral d={d} gl={gl} />}
          {active === "finanzas" && <DashboardFinanzas d={d} gl={gl} />}
          {active === "operaciones" && <DashboardOperaciones d={d} />}
          {active === "cartera" && <DashboardCartera d={d} />}
          {active === "inventario" && <DashboardInventario d={d} />}
          {active === "comercial" && <DashboardComercial d={d} />}
        </div>
      )}
      <OmegaCrossSellCard />
    </div>
  );
}
