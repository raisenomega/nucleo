import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useSuperAdmin } from "@shared/hooks/useSuperAdmin";
import { CampaignEditor } from "@campaigns/presentation/CampaignEditor";

export const Route = createFileRoute("/_authenticated/web/campanas/$id")({ component: Page });

function Page() {
  const { isSuperAdmin } = useSuperAdmin();
  const { id } = Route.useParams();
  const nav = useNavigate();
  if (!isSuperAdmin) return <Navigate to="/dashboard" />;
  return <CampaignEditor id={id} nav={{
    host: "nucleoraisen.com",
    toEditor: (pid) => void nav({ to: "/web/campanas/$id", params: { id: pid } }),
    toLeads: () => void nav({ to: "/web/leads" }),
  }} />;
}
