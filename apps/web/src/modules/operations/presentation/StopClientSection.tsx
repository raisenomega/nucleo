import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import { LinkedCustomerBadge } from "@shared/components/LinkedCustomerBadge";
import type { RouteStop } from "@operations/domain/route.types";

// Sección Cliente del detalle de parada: datos + monto destacado. Link al maestro si la parada está vinculada.
export function StopClientSection({ stop }: { stop: RouteStop }) {
  const { t } = useI18n();
  const row = (l: string, v: string) => (
    <div className="flex justify-between gap-2"><span className="text-muted-foreground">{l}</span><span className="text-right">{v}</span></div>
  );
  return (
    <div className="space-y-2 rounded-xl border border-border bg-card p-4 text-sm">
      <LinkedCustomerBadge customerId={stop.customerId} name={stop.clientName} className="text-lg font-semibold" />
      {stop.phone && <div className="flex justify-between gap-2"><span className="text-muted-foreground">{t("phone")}</span>
        <a href={`tel:${stop.phone}`} className="font-bold text-foreground">{stop.phone}</a></div>}
      {row(t("address"), `${stop.address}${stop.city ? ", " + stop.city : ""}`)}
      {row(t("serviceRequested"), stop.serviceType)}
      {row(t("scheduledTime"), stop.scheduledTime.slice(0, 5))}
      {stop.notes && <div className="rounded-lg bg-secondary p-2 text-xs"><span className="font-bold">{t("serviceDescription")}: </span>{stop.notes}</div>}
      <div className="flex items-center justify-between border-t border-border pt-2">
        <span className="text-muted-foreground">{t("amount")}</span>
        <span className="text-xl font-bold text-foreground">{formatCurrency(stop.estimatedAmount)}</span>
      </div>
    </div>
  );
}
