import { Link } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import { KpiCard } from "@finance/presentation/KpiCard";
import type { DashData } from "@finance/application/useDashboard.hook";

// Banda Operaciones: rutas de hoy + flota en servicio + alertas de mantenimiento. Cada card navega a su módulo.
export function DashOps({ d }: { d: DashData }) {
  const { t } = useI18n();
  const o = d.ops;
  if (!o) return null;
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      <Link to="/routes" search={{ customer: undefined, cname: undefined, cphone: undefined, caddr: undefined }}><KpiCard label={t("routesToday")} value={`${o.routesDone}/${o.routesTotal}`} sub={`${o.stopsDone}/${o.stopsTotal} ${t("stopsCount")}`} /></Link>
      <Link to="/gps"><KpiCard label={t("vehiclesInService")} value={`${o.fleetInService}`} sub={o.geofenceEvents > 0 ? `${o.geofenceEvents} ${t("geofenceAlerts")}` : undefined} /></Link>
      <Link to="/assets"><KpiCard label={t("maintenanceAlerts")} value={`${o.maintAlerts}`} /></Link>
    </div>
  );
}
