import { createFileRoute } from "@tanstack/react-router";
import { TrialBanner } from "@shared/components/TrialBanner";
import { useI18n } from "@shared/i18n";
import { useDashboard } from "@finance/application/useDashboard.hook";
import { supabaseDashboardRepository } from "@finance/infrastructure/supabase-dashboard.repository";
import { DashboardKpis } from "@finance/presentation/DashboardKpis";
import { DashboardCrm } from "@finance/presentation/DashboardCrm";
import { DashboardMarketing } from "@finance/presentation/DashboardMarketing";
import { DashboardFiscal } from "@finance/presentation/DashboardFiscal";
import { DashboardRecent } from "@finance/presentation/DashboardRecent";
import { DashboardRecentLeads } from "@finance/presentation/DashboardRecentLeads";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { t } = useI18n();
  const { snapshot, crm, mkt, fiscal, isLoading } = useDashboard(supabaseDashboardRepository);
  return (
    <div className="space-y-6 p-8">
      <TrialBanner />
      <h1 className="font-display text-3xl font-bold text-primary">{t("welcome")}</h1>
      {isLoading || !snapshot || !crm ? (
        <p className="font-body text-muted-foreground">{t("noData")}</p>
      ) : (
        <div className="space-y-6">
          <DashboardKpis s={snapshot} bankBalance={fiscal?.realBalance} />
          <div className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{t("crmSection")}</h2>
            <DashboardCrm c={crm} />
          </div>
          {fiscal && (
            <div className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{t("fiscalSection")}</h2>
              <DashboardFiscal f={fiscal} />
            </div>
          )}
          {mkt && (
            <div className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{t("marketing")}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3"><DashboardMarketing m={mkt} /></div>
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <DashboardRecent s={snapshot} />
            <DashboardRecentLeads leads={crm.recentLeads} />
          </div>
        </div>
      )}
    </div>
  );
}
