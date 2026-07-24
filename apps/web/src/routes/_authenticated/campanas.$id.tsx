import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useBrand } from "@shared/providers/BrandProvider";
import { useSession } from "@shared/providers/SessionProvider";
import { useTenantPublicHost } from "@shared/hooks/useTenantPublicHost";
import { CampaignEditor } from "@campaigns/presentation/CampaignEditor";

export const Route = createFileRoute("/_authenticated/campanas/$id")({ component: Page });

function Page() {
  const brand = useBrand();
  const { session } = useSession();
  const { id } = Route.useParams();
  const host = useTenantPublicHost();
  const nav = useNavigate();
  const isCeo = session?.role === "ceo" || session?.role === "superadmin";
  if (!brand.landingEnabled || !isCeo) return <Navigate to="/dashboard" />;
  return <CampaignEditor id={id} nav={{
    host,
    toEditor: (pid) => void nav({ to: "/campanas/$id", params: { id: pid } }),
    toLeads: () => void nav({ to: "/leads" }),
  }} />;
}
