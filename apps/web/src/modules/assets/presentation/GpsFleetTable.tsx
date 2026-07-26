import { MapPin } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { ASSET_TYPE, STATUS } from "@assets/presentation/asset-labels";
import type { Asset } from "@assets/domain/asset.types";

// Tabla de flota GPS: monitoreo (no gestión). Estado in_use = "en servicio" verde; resto usa el badge de estado.
const ago = (iso?: string): string => {
  if (!iso) return "—";
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return `${Math.round(s)}s`;
  if (s < 3600) return `${Math.round(s / 60)}m`;
  if (s < 86400) return `${Math.round(s / 3600)}h`;
  return `${Math.round(s / 86400)}d`;
};

export function GpsFleetTable({ rows, lastReport, onMap }: { rows: readonly Asset[]; lastReport: Record<string, string>; onMap: (id: string) => void }) {
  const { t } = useI18n();
  const th = "px-3 py-2 text-left font-bold";
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-secondary text-xs uppercase text-muted-foreground"><tr><th className={th}>{t("name")}</th><th className={th}>{t("assetType")}</th><th className={th}>{t("assignedTo")}</th><th className={th}>{t("status")}</th><th className={th}>{t("updatedAgo")}</th><th className={th} /></tr></thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">{t("noAssets")}</td></tr>}
          {rows.map((a) => (
            <tr key={a.id} className="border-t border-border">
              <td className="px-3 py-2 font-medium text-foreground">{a.name}</td>
              <td className="px-3 py-2 text-muted-foreground">{t(ASSET_TYPE[a.assetType])}</td>
              <td className="px-3 py-2 text-muted-foreground">{a.assignedToName || "—"}</td>
              <td className="px-3 py-2">{a.status === "in_use"
                ? <span className="rounded bg-green-500/10 px-1.5 py-0.5 text-xs font-bold text-green-600">{t("stInUse")}</span>
                : <span className={`rounded px-1.5 py-0.5 text-xs font-bold ${STATUS[a.status].cls}`}>{t(STATUS[a.status].key)}</span>}</td>
              <td className="px-3 py-2 text-muted-foreground">{ago(lastReport[a.id])}</td>
              <td className="px-3 py-2 text-right"><button type="button" onClick={() => onMap(a.id)} className="inline-flex items-center gap-1 rounded-lg bg-secondary px-2.5 py-1.5 text-xs font-bold text-foreground"><MapPin className="h-4 w-4" />{t("viewOnMap")}</button></td>
            </tr>))}
        </tbody>
      </table>
    </div>
  );
}
