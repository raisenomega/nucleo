import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { TenantAnalyticsPanel } from "@shared/analytics/TenantAnalyticsPanel";

export const Route = createFileRoute("/_authenticated/settings/landing/analytics")({ component: Page });

function Page() {
  const { can } = useModuleAccess();
  if (!can("settings", "view")) return <Navigate to="/dashboard" />;
  return <TenantAnalyticsPanel />;
}
