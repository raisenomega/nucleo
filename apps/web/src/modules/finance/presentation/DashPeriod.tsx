import { useI18n } from "@shared/i18n";

// Selector de período. Los snapshots son por mes → 2 opciones funcionales (este mes / mes anterior).
// La gráfica de tendencia ya cubre el año completo. Trimestre/año requieren RPCs con rango (follow-up).
export type PeriodKey = "cur" | "prev";
const OPTS: { k: PeriodKey; label: "currentMonth" | "previousMonth" }[] = [
  { k: "cur", label: "currentMonth" }, { k: "prev", label: "previousMonth" },
];

export function DashPeriod({ value, onChange }: { value: PeriodKey; onChange: (k: PeriodKey) => void }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-wrap gap-1">
      {OPTS.map((o) => (
        <button key={o.k} type="button" onClick={() => onChange(o.k)}
          className={`rounded-lg px-3 py-1.5 text-xs font-bold ${value === o.k ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>{t(o.label)}</button>
      ))}
    </div>
  );
}
