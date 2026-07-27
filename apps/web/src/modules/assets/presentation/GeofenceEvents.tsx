import { useI18n } from "@shared/i18n";
import type { GeofenceEventRow } from "@assets/infrastructure/geofence.repository";

// Historial de eventos de geocerca (últimos 50). Entró = verde, Salió = ámbar.
export function GeofenceEvents({ rows }: { rows: GeofenceEventRow[] }) {
  const { t } = useI18n();
  const th = "px-3 py-2 text-left font-bold";
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-secondary text-xs uppercase text-muted-foreground"><tr><th className={th}>{t("updatedAgo")}</th><th className={th}>{t("assets")}</th><th className={th}>{t("geofences")}</th><th className={th} /></tr></thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">—</td></tr>}
          {rows.map((e) => (
            <tr key={e.id} className="border-t border-border">
              <td className="px-3 py-2 text-muted-foreground">{e.recordedAt.slice(0, 16).replace("T", " ")}</td>
              <td className="px-3 py-2 font-medium text-foreground">{e.assetName}</td>
              <td className="px-3 py-2 text-muted-foreground">{e.geofenceName}</td>
              <td className="px-3 py-2 text-right"><span className={`rounded px-1.5 py-0.5 text-xs font-bold ${e.eventType === "enter" ? "bg-green-500/10 text-green-600" : "bg-amber-500/10 text-amber-600"}`}>{t(e.eventType === "enter" ? "gfEntered" : "gfExited")}</span></td>
            </tr>))}
        </tbody>
      </table>
    </div>
  );
}
