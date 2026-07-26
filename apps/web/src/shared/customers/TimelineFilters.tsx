// Chips de filtro del timeline del cliente (rodaja 10). El filtro es client-side por prefijo de eventType.
const FILTERS: { key: string; label: string }[] = [
  { key: "all", label: "Todos" }, { key: "invoice", label: "Facturas" }, { key: "payment", label: "Pagos" },
  { key: "quote", label: "Cotizaciones" }, { key: "order", label: "Órdenes" },
  { key: "service", label: "Servicios" }, { key: "lead", label: "Leads" },
];

export function TimelineFilters({ value, onChange }: { value: string; onChange: (k: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {FILTERS.map((f) => (
        <button key={f.key} type="button" onClick={() => onChange(f.key)}
          className={`rounded-full px-3 py-1 text-xs font-bold ${value === f.key ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"}`}>{f.label}</button>))}
    </div>
  );
}
