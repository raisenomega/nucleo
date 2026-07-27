import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useI18n } from "@shared/i18n";
import type { HistoryPoint } from "@hr/domain/evalcycle.types";

// Evolución del score del empleado por período.
export function EvalHistoryChart({ history }: { history: readonly HistoryPoint[] }) {
  const { t } = useI18n();
  if (history.length === 0) return null;
  const data = history.map((h) => ({ period: h.period, score: h.score }));
  return (
    <div className="space-y-1">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{t("progress")}</p>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}><XAxis dataKey="period" tick={{ fontSize: 11 }} /><YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
          <Tooltip /><Line dataKey="score" stroke="hsl(38 85% 55%)" strokeWidth={2} /></LineChart>
      </ResponsiveContainer>
    </div>
  );
}
