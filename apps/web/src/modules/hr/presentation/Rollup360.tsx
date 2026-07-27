import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts";
import { useI18n } from "@shared/i18n";
import type { Rollup360 as R } from "@hr/domain/evalcycle.types";

// Consolidado 360°: score por perspectiva + radar por criterio.
export function Rollup360({ rollup }: { rollup: R }) {
  const { t } = useI18n();
  const data = rollup.byCriteria.map((c) => ({ criterion: c.name, avg: c.avg }));
  return (
    <div className="space-y-2">
      <p className="text-sm"><span className="font-bold">{t("composite")}: </span>{rollup.consolidatedScore ?? "—"}</p>
      <div className="flex flex-wrap gap-2 text-xs">{Object.entries(rollup.perspectives).map(([k, v]) => (
        <span key={k} className="rounded bg-secondary px-2 py-0.5">{k}: <span className="font-bold text-foreground">{v.score}</span> ({v.count})</span>))}</div>
      {data.length > 0 && (
        <ResponsiveContainer width="100%" height={240}>
          <RadarChart data={data}><PolarGrid /><PolarAngleAxis dataKey="criterion" tick={{ fontSize: 11 }} />
            <Radar dataKey="avg" stroke="hsl(38 85% 55%)" fill="hsl(38 85% 55%)" fillOpacity={0.5} /></RadarChart>
        </ResponsiveContainer>)}
    </div>
  );
}
