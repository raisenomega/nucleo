import { createFileRoute } from "@tanstack/react-router";
import { TrialBanner } from "@shared/components/TrialBanner";
import { useI18n } from "@shared/i18n";
import { useDashboard } from "@finance/application/useDashboard.hook";
import { supabaseDashboardRepository } from "@finance/infrastructure/supabase-dashboard.repository";
import { DashboardKpis } from "@finance/presentation/DashboardKpis";
import { DashboardRecent } from "@finance/presentation/DashboardRecent";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { t } = useI18n();
  const { snapshot, isLoading } = useDashboard(supabaseDashboardRepository);
  return (
    <div className="space-y-6 p-8">
      <TrialBanner />
      <h1 className="font-display text-3xl font-bold text-primary">{t("welcome")}</h1>
      {isLoading || !snapshot ? (
        <p className="font-body text-muted-foreground">{t("noData")}</p>
      ) : (
        <>
          <DashboardKpis s={snapshot} />
          <DashboardRecent s={snapshot} />
        </>
      )}
    </div>
  );
}
