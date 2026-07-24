import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useSuperAdmin } from "@shared/hooks/useSuperAdmin";
import { PlatformAnalyticsPanel } from "@shared/analytics/PlatformAnalyticsPanel";

export const Route = createFileRoute("/_authenticated/platform/analytics")({ component: Page });

function Page() {
  const { isSuperAdmin } = useSuperAdmin();
  if (!isSuperAdmin) return <Navigate to="/dashboard" />;
  return <PlatformAnalyticsPanel />;
}
