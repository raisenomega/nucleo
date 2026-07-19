import { createFileRoute, Link } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import { usePortal } from "@shared/portal/portal-context";

export const Route = createFileRoute("/portal/_app/")({ component: PortalHome });

// Inicio del cliente — datos reales de su perfil (los counts de órdenes/facturas llegan en P2/P3).
function PortalHome() {
  const { t } = useI18n();
  const { customer } = usePortal();
  const incomplete = !customer.fullName || !customer.phone || !customer.address;
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold text-foreground">{t("pWelcome")}, {customer.fullName || customer.email}</h1>
      {incomplete && (
        <Link to="/portal/profile" className="block rounded-lg border border-primary bg-primary/5 p-4">
          <p className="font-bold text-foreground">{t("pCompleteProfile")}</p>
          <p className="text-sm text-muted-foreground">{t("pCompleteHint")}</p>
        </Link>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link to="/portal/profile" className="rounded-lg border border-border bg-card p-4 font-bold text-foreground">{t("navProfile")}</Link>
        <span className="cursor-not-allowed rounded-lg border border-border bg-card p-4 font-bold text-muted-foreground opacity-60">{t("navRequest")} · {t("pComingSoon")}</span>
      </div>
    </div>
  );
}
