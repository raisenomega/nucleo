// Lista compacta reusable para las vistas profundas (deudores, bajo stock, pagos, cotizaciones…).
export interface ListRow { label: string; sub?: string; value?: string }

export function DashList({ title, rows }: { title: string; rows: readonly ListRow[] }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="mb-2 text-xs font-bold uppercase text-muted-foreground">{title}</p>
      {rows.length === 0 ? <p className="text-sm text-muted-foreground">—</p> : (
        <div className="space-y-1">
          {rows.slice(0, 8).map((r, i) => (
            <div key={i} className="flex items-center justify-between gap-2 border-b border-border pb-1 text-sm last:border-0 last:pb-0">
              <div className="min-w-0"><p className="truncate font-medium text-foreground">{r.label}</p>{r.sub && <p className="truncate text-xs text-muted-foreground">{r.sub}</p>}</div>
              {r.value && <span className="shrink-0 font-semibold text-foreground">{r.value}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
