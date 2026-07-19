import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import { usePortal } from "@shared/portal/portal-context";
import { useCustomerServices } from "@shared/portal/useCustomerServices.hook";
import { ServiceCard } from "@shared/portal/ServiceCard";

export const Route = createFileRoute("/portal/_app/services")({ component: PortalServices });

// Historial de servicios recibidos (route_stops asociados al teléfono del cliente, best-effort).
function PortalServices() {
  const { t } = useI18n();
  const { customer } = usePortal();
  const s = useCustomerServices(customer.tenantId);
  return (
    <div className="space-y-3">
      <h1 className="font-display text-2xl font-bold text-foreground">{t("navServices")}</h1>
      <p className="text-xs text-muted-foreground">{t("pServicesNote")}</p>
      {s.services.length === 0 && <p className="text-sm text-muted-foreground">{t("pNoServices")}</p>}
      {s.services.map((sv) => <ServiceCard key={sv.id} service={sv} />)}
    </div>
  );
}
