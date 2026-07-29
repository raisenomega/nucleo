import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { CheckCircle2 } from "lucide-react";
import { EmptyChartState } from "@finance/presentation/EmptyChartState";
import type { Aging } from "@finance/domain/dashboard.types";

// Barra de antigüedad (AR/AP): corriente → 90+, coloreada de verde a rojo por bucket.
const COLORS = ["seagreen", "goldenrod", "orange", "crimson", "darkred"];

export function DashAgingBar({ title, aging, emptyMessage }: { title: string; aging: Aging; emptyMessage: string }) {
  const data = [
    { name: "Corr.", v: aging.current }, { name: "1-30", v: aging.b1_30 }, { name: "31-60", v: aging.b31_60 },
    { name: "61-90", v: aging.b61_90 }, { name: "90+", v: aging.b90_plus },
  ];
  const total = data.reduce((s, x) => s + (x.v || 0), 0);
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="mb-1 text-xs font-bold uppercase text-muted-foreground">{title}</p>
      {total === 0 ? <EmptyChartState variant="positive" icon={CheckCircle2} message={emptyMessage} /> : (
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data}>
          <XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} width={44} /><Tooltip />
          <Bar dataKey="v" radius={[4, 4, 0, 0]}>{data.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}</Bar>
        </BarChart>
      </ResponsiveContainer>)}
    </div>
  );
}
