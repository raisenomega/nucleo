import { Camera } from "lucide-react";
import { useI18n } from "@shared/i18n";
import type { CustomerService } from "@shared/portal/service.types";

// Servicio recibido (route_stop): tipo + fecha + estado + dirección + notas + conteo de evidencia.
export function ServiceCard({ service }: { service: CustomerService }) {
  const { t } = useI18n();
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center justify-between">
        <span className="font-bold text-foreground">{service.serviceType || t("pService")}</span>
        <span className="text-xs text-muted-foreground">{service.completedAt ? service.completedAt.slice(0, 10) : "—"}</span>
      </div>
      {service.address && <p className="text-xs text-muted-foreground">{service.address}</p>}
      <div className="mt-1 flex items-center gap-2 text-xs">
        <span className="rounded bg-secondary px-1.5 py-0.5">{service.status}</span>
        {service.evidenceCount > 0 && <span className="inline-flex items-center gap-1 text-muted-foreground"><Camera className="h-3 w-3" />{service.evidenceCount}</span>}
      </div>
      {service.notes && <p className="mt-1 text-sm text-foreground">{service.notes}</p>}
    </div>
  );
}
