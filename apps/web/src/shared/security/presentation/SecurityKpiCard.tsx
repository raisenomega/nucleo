// KPI card del dashboard de seguridad. tone colorea el valor (peligro/aviso).
export function SecurityKpiCard({ label, value, tone }: { label: string; value: string | number; tone?: "danger" | "warn" }) {
  const color = tone === "danger" ? "text-red-600" : tone === "warn" ? "text-orange-600" : "text-foreground";
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="truncate text-xs text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
