import { Radio } from "lucide-react";
import { useI18n } from "@shared/i18n";
import type { FleetPosition } from "@assets/infrastructure/fleet.repository";

// Resumen de flota + badge de conexión Realtime (En vivo / Sin conexión).
const stale = (iso: string | null) => !iso || (Date.now() - new Date(iso).getTime()) / 1000 > 1800;

export function GpsFleetSummary({ positions, isConnected }: { positions: FleetPosition[]; isConnected: boolean }) {
  const { t } = useI18n();
  const inService = positions.filter((p) => p.hasActiveCustody && p.status !== "maintenance").length;
  const available = positions.filter((p) => !p.hasActiveCustody && p.status !== "maintenance").length;
  const maint = positions.filter((p) => p.status === "maintenance").length;
  const noSignal = positions.filter((p) => p.hasActiveCustody && stale(p.recordedAt)).length;
  const Chip = ({ cls, label, n }: { cls: string; label: string; n: number }) => (
    <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold ${cls}`}><span className="h-2 w-2 rounded-full bg-current" />{label}: {n}</span>
  );
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold ${isConnected ? "bg-green-500/10 text-green-600" : "bg-secondary text-muted-foreground"}`}>
        <Radio className={`h-3.5 w-3.5 ${isConnected ? "animate-pulse" : ""}`} />{isConnected ? t("liveOn") : t("liveOff")}</span>
      <Chip cls="bg-green-500/10 text-green-600" label={t("inService")} n={inService} />
      <Chip cls="bg-secondary text-muted-foreground" label={t("available")} n={available} />
      <Chip cls="bg-amber-500/10 text-amber-600" label={t("stMaintenance")} n={maint} />
      {noSignal > 0 && <Chip cls="bg-destructive/10 text-destructive" label={t("noSignal")} n={noSignal} />}
    </div>
  );
}
