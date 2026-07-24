import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useSuperAdmin } from "@shared/hooks/useSuperAdmin";
import { CampaignEditor } from "@campaigns/presentation/CampaignEditor";

export const Route = createFileRoute("/_authenticated/web/campanas/$id")({ component: Page });

function Page() {
  const { isSuperAdmin } = useSuperAdmin();
  const { id } = Route.useParams();
  if (!isSuperAdmin) return <Navigate to="/dashboard" />;
  return <CampaignEditor id={id} />;
}
