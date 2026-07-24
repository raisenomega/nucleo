import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useSuperAdmin } from "@shared/hooks/useSuperAdmin";
import { CampaignsList } from "@campaigns/presentation/CampaignsList";

export const Route = createFileRoute("/_authenticated/web/campanas/")({ component: Page });

function Page() {
  const { isSuperAdmin } = useSuperAdmin();
  if (!isSuperAdmin) return <Navigate to="/dashboard" />;
  return <CampaignsList />;
}
