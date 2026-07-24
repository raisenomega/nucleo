import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useSuperAdmin } from "@shared/hooks/useSuperAdmin";
import { CampaignsList } from "@campaigns/presentation/CampaignsList";

export const Route = createFileRoute("/_authenticated/web/campanas/")({ component: Page });

// Campañas del SUPERADMIN (sentinela = nucleoraisen.com). Mismos componentes que el tenant, distinto scope.
function Page() {
  const { isSuperAdmin } = useSuperAdmin();
  const nav = useNavigate();
  if (!isSuperAdmin) return <Navigate to="/dashboard" />;
  return <CampaignsList nav={{
    host: "nucleoraisen.com",
    toEditor: (id) => void nav({ to: "/web/campanas/$id", params: { id } }),
    toLeads: () => void nav({ to: "/web/leads" }),
  }} />;
}
