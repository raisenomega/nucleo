import { useEffect, useState } from "react";
import { Navigation, MapPin } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { gmapsDirUrl } from "@shared/lib/geo";
import { supabaseAssetRepository } from "@assets/infrastructure/supabase-asset.repository";
import { computeGpsMetrics, type GpsMetrics } from "@assets/application/gps-metrics";

// Sección "Recorrido GPS": métricas del último trayecto + link al mapa de Google.
export function AssetGpsTrack({ assetId }: { assetId: string }) {
  const { t } = useI18n();
  const [m, setM] = useState<GpsMetrics | null>(null);
  useEffect(() => { void supabaseAssetRepository.listGpsLogs(assetId).then((l) => setM(computeGpsMetrics(l))); }, [assetId]);
  if (!m) return null;
  const cell = (label: string, v: string) => <div><dt className="text-muted-foreground">{label}</dt><dd className="font-semibold">{v}</dd></div>;
  return (
    <div className="space-y-2 border-t border-border pt-2">
      <p className="flex items-center gap-1.5 text-xs font-bold uppercase text-muted-foreground"><Navigation className="h-4 w-4" />{t("gpsTrack")}</p>
      <dl className="grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
        {cell(t("distance"), `${m.miles.toFixed(1)} mi`)}
        {cell(t("avgSpeed"), `${m.avgSpeed.toFixed(0)} mph`)}
        {cell(t("duration"), `${m.minutes.toFixed(0)} min`)}
        {cell(t("gpsPoints"), `${m.points} · ±${m.avgAccuracy.toFixed(0)}m`)}
      </dl>
      {m.geo.length > 1 && <a href={gmapsDirUrl(m.geo)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-sm font-bold text-foreground"><MapPin className="h-4 w-4" />{t("viewRouteMap")}</a>}
    </div>
  );
}
