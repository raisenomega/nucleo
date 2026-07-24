import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useBrand } from "@shared/providers/BrandProvider";
import { useSession } from "@shared/providers/SessionProvider";
import { useTenantPublicHost } from "@shared/hooks/useTenantPublicHost";
import { CampaignsList } from "@campaigns/presentation/CampaignsList";

export const Route = createFileRoute("/_authenticated/campanas/")({ component: Page });

// Campañas del TENANT. Gate = landing_enabled + isCeo (igual que la sección LANDING). Dominio público del tenant.
function Page() {
  const brand = useBrand();
  const { session } = useSession();
  const host = useTenantPublicHost();
  const nav = useNavigate();
  const isCeo = session?.role === "ceo" || session?.role === "superadmin";
  if (!brand.landingEnabled || !isCeo) return <Navigate to="/dashboard" />;
  return <CampaignsList nav={{
    host,
    toEditor: (id) => void nav({ to: "/campanas/$id", params: { id } }),
    toLeads: () => void nav({ to: "/leads" }),
  }} />;
}
