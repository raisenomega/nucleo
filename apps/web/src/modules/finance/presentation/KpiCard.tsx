// Tarjeta KPI reusable del dashboard, con variación opcional (▲ verde / ▼ rojo) vs período anterior.
export function KpiCard({ label, value, delta, sub }: { label: string; value: string; delta?: number | null; sub?: string }) {
  const hasDelta = delta != null && Number.isFinite(delta);
  const up = (delta ?? 0) >= 0;
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="truncate text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold text-foreground">{value}</p>
      {(hasDelta || sub) && (
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs">
          {hasDelta && <span className={up ? "font-bold text-green-600" : "font-bold text-red-600"}>{up ? "▲" : "▼"} {Math.abs(delta as number).toFixed(0)}%</span>}
          {sub && <span className="truncate text-muted-foreground">{sub}</span>}
        </div>
      )}
    </div>
  );
}
