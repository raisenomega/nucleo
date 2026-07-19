import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
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
const btn = "rounded-lg px-4 py-2 text-sm font-bold";
function NoticeBox({ title, msg, children }: { title: string; msg: string; children: ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center bg-background p-6 text-center text-foreground">
      <div className="space-y-3"><p className="font-bold">{title}</p><p className="text-sm text-muted-foreground">{msg}</p>
        <div className="flex flex-wrap justify-center gap-2">{children}</div></div>
    </div>
  );
}

// Guard del portal: identidad por DATOS (customer_profiles), no por ausencia de claims. Perfil ⇒ cliente; claims ⇒ staff.
function PortalApp() {
  const { t } = useI18n();
  const { session, isLoading } = useSession();
  const b = usePublicBrand();
  const tenantId = b.status === "ready" ? b.brand.tenantId : null;
  // SIEMPRE consultamos el perfil: si existe ⇒ es cliente (register_customer impide que un staff del tenant tenga perfil).
  const { customer, loading, refresh } = useCustomer(session ? tenantId : null);
  const isStaff = !!session && (!!session.tenantId || !!session.role);
  const tried = useRef(false);
  useEffect(() => {
    if (isStaff || !session || !tenantId || loading || customer || tried.current) return;
    tried.current = true; // cliente sin perfil aún: lo crea con la intención de registro (o vacío) y refresca
    const p = getPending();
    const [name, phone] = p && p.tenantId === tenantId ? [p.name, p.phone] : ["", ""];
    void registerCustomer(tenantId, name, phone).then(() => { clearPending(); void refresh(); });
  }, [isStaff, session, tenantId, loading, customer, refresh]);
  const signOut = () => void signOutCustomer().then(() => window.location.assign("/portal/login"));
  if (isLoading || b.status === "loading" || (session && loading)) return <Spin />;
  if (!session) return <Navigate to="/portal/login" />;
  if (customer) { // 1) tiene perfil de cliente → portal
    if (!customer.isActive) return <NoticeBox title={t("pDeactivated")} msg={t("pDeactivatedMsg")}><button type="button" onClick={signOut} className={`${btn} bg-secondary`}>{t("signOut")}</button></NoticeBox>;
    const brand = b.status === "ready" ? b.brand : null;
    return (
      <PortalContext.Provider value={{ customer, refresh }}>
        <PortalShell customer={customer} logoUrl={brand?.logoUrl ?? null} displayName={brand?.displayName ?? ""} />
      </PortalContext.Provider>
    );
  }
  if (isStaff) { // 2) staff sin perfil de cliente → aviso (NO renderizar el admin en el dominio del cliente)
    const h = typeof window !== "undefined" ? window.location.hostname.replace(/^www\./, "") : "";
    const adminUrl = `https://${h.startsWith("app.") ? h : "app." + h}/dashboard`;
    return (
      <NoticeBox title={t("pStaffTitle")} msg={t("pStaffMsg")}>
        <a href={adminUrl} className={`${btn} bg-primary text-primary-foreground`}>{t("pGoAdmin")}</a>
        <button type="button" onClick={signOut} className={`${btn} bg-secondary`}>{t("signOut")}</button>
      </NoticeBox>
    );
  }
  return <Spin />; // 3) cliente sin perfil todavía (auto-registrando)
}
