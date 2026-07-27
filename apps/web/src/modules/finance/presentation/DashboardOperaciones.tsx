import { useI18n } from "@shared/i18n";
import type { DashData } from "@finance/application/useDashboard.hook";
import { DashOps } from "@finance/presentation/DashOps";
import { DashList } from "@finance/presentation/DashList";

// Vista profunda Operaciones: KPIs de rutas/flota/mantenimiento + estado de cada vehículo. Mapa vivo en /gps.
export function DashboardOperaciones({ d }: { d: DashData }) {
  const { t } = useI18n();
  const fleet = d.fleet.map((f) => {
    const kmh = f.speed != null ? ` · ${(f.speed * 3.6).toFixed(0)} km/h` : "";
    return { label: f.name, sub: f.assignedTo ?? "—", value: (f.hasCustody ? t("inService") : f.status) + kmh };
  });
  return (
    <div className="space-y-4">
      <DashOps d={d} />
      <DashList title={t("vehicle")} rows={fleet} />
    </div>
  );
}
