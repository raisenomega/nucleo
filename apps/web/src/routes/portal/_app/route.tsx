import { useEffect, useRef } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import { useSession } from "@shared/providers/SessionProvider";
import { signOutCustomer } from "@shared/portal/portal-auth";
import { usePublicBrand } from "@landing-public/presentation/usePublicBrand.hook";
import { useCustomer } from "@shared/portal/useCustomer.hook";
import { registerCustomer } from "@shared/portal/customer.repository";
import { getPending, clearPending } from "@shared/portal/pending-register";
import { PortalContext } from "@shared/portal/portal-context";
import { PortalShell } from "@shared/portal/PortalShell";

export const Route = createFileRoute("/portal/_app")({ component: PortalApp });

const Spin = () => <div className="grid min-h-screen place-items-center bg-background"><p className="text-muted-foreground">…</p></div>;

// Guard del portal: staff → admin; sin sesión → login; customer sin perfil aún → auto-registra bajo este tenant.
function PortalApp() {
  const { t } = useI18n();
  const { session, isLoading } = useSession();
  const b = usePublicBrand();
  const tenantId = b.status === "ready" ? b.brand.tenantId : null;
  const isCustomer = !!session && !session.tenantId && !session.role;
  const { customer, loading, refresh } = useCustomer(isCustomer ? tenantId : null);
  const tried = useRef(false);
  useEffect(() => {
    if (!isCustomer || !tenantId || loading || customer || tried.current) return;
    tried.current = true; // una sola vez: completa el perfil con la intención de registro (o vacío) y refresca
    const p = getPending();
    const [name, phone] = p && p.tenantId === tenantId ? [p.name, p.phone] : ["", ""];
    void registerCustomer(tenantId, name, phone).then(() => { clearPending(); void refresh(); });
  }, [isCustomer, tenantId, loading, customer, refresh]);
  if (isLoading || b.status === "loading") return <Spin />;
  if (!session) return <Navigate to="/portal/login" />;
  if (session.tenantId || session.role) return <Navigate to="/dashboard" />; // staff no entra al portal
  if (loading || !customer) return <Spin />;
  if (!customer.isActive) return (
    <div className="grid min-h-screen place-items-center bg-background p-6 text-center text-foreground">
      <div className="space-y-3"><p className="font-bold">{t("pDeactivated")}</p><p className="text-sm text-muted-foreground">{t("pDeactivatedMsg")}</p>
        <button type="button" onClick={() => void signOutCustomer().then(() => window.location.assign("/portal/login"))} className="rounded-lg bg-secondary px-4 py-2 text-sm">{t("signOut")}</button></div>
    </div>
  );
  const brand = b.status === "ready" ? b.brand : null;
  return (
    <PortalContext.Provider value={{ customer, refresh }}>
      <PortalShell customer={customer} logoUrl={brand?.logoUrl ?? null} displayName={brand?.displayName ?? ""} />
    </PortalContext.Provider>
  );
}
