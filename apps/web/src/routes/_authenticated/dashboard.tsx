import { createFileRoute } from "@tanstack/react-router";
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
import { DashboardKpis } from "@finance/presentation/DashboardKpis";
import { DashboardCrm } from "@finance/presentation/DashboardCrm";
import { DashboardMarketing } from "@finance/presentation/DashboardMarketing";
import { DashboardFiscal } from "@finance/presentation/DashboardFiscal";
import { DashboardRecent } from "@finance/presentation/DashboardRecent";
import { DashboardRecentLeads } from "@finance/presentation/DashboardRecentLeads";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: Dashboard });

function Dashboard() {
  const { isSuperAdmin } = useSuperAdmin();
  if (isSuperAdmin) return <PlatformDashboard />; // superadmin → dashboard de plataforma, no el financiero del tenant
  const { t } = useI18n();
  const { can } = useModuleAccess();
  const { session } = useSession();
  const brand = useBrand();
  const { snapshot, crm, mkt, fiscal, isLoading } = useDashboard(supabaseDashboardRepository);
  const finance = can("income", "view") || can("expenses", "view");
  const sh = "text-xs font-bold uppercase tracking-wide text-muted-foreground";
  const rawName = brand.displayName || brand.legalName;
  const tenantName = !rawName || rawName === "Mi Negocio" ? t("yourBusiness") : rawName;
  return (
    <div className="space-y-6 p-4 md:p-8">
      <TrialBanner />
      <div><h1 className="font-display text-xl font-bold text-foreground md:text-3xl">{t("welcome")} {tenantName}</h1>
        <p className="text-xs text-muted-foreground">{session?.email} · {session?.role ?? "—"}</p></div>
      {can("dashboard", "view") && (isLoading || !snapshot || !crm ? (
        <p className="font-body text-muted-foreground">{t("noData")}</p>
      ) : (
        <div className="space-y-6">
          {finance && <DashboardKpis s={snapshot} bankBalance={fiscal?.bankCalculated} />}
          {can("leads", "view") && <div className="space-y-2"><h2 className={sh}>{t("crmSection")}</h2><DashboardCrm c={crm} /></div>}
          {fiscal && can("reconciliation", "view") && <div className="space-y-2"><h2 className={sh}>{t("fiscalSection")}</h2><DashboardFiscal f={fiscal} /></div>}
          {mkt && can("marketing", "view") && <div className="space-y-2"><h2 className={sh}>{t("marketing")}</h2><div className="grid grid-cols-1 sm:grid-cols-3"><DashboardMarketing m={mkt} /></div></div>}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {finance && <DashboardRecent s={snapshot} />}
            {can("leads", "view") && <DashboardRecentLeads leads={crm.recentLeads} />}
          </div>
        </div>
      ))}
      <OmegaCrossSellCard />
    </div>
  );
}
