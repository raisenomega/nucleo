import { useI18n } from "@shared/i18n";

// Selector de período del dashboard. El antiguo chip "Este mes" se volvió una CASCADA: el usuario
// escoge cualquier mes y ve la data completa de ese mes. Es solo lectura (los snapshots son RPCs
// SELECT con p_month) → nunca altera la data del tenant. Vive en el núcleo → aplica a todos.
// `value` = meses hacia atrás desde el mes actual (0 = este mes, 1 = mes anterior, …).
const MONTHS_BACK = 36;
const fmtLocale = (l: string) => (l === "es" ? "es-PR" : "en-US");

export function DashPeriod({ value, onChange }: { value: number; onChange: (offset: number) => void }) {
  const { t, locale } = useI18n();
  const now = new Date();
  const options = Array.from({ length: MONTHS_BACK + 1 }, (_, offset) => {
    const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const raw = d.toLocaleDateString(fmtLocale(locale), { month: "long", year: "numeric" });
    let label = raw.charAt(0).toUpperCase() + raw.slice(1);
    if (offset === 0) label += ` · ${t("currentMonth")}`;
    else if (offset === 1) label += ` · ${t("previousMonth")}`;
    return { offset, label };
  });
  return (
    <select aria-label={t("selectMonth")} value={value} onChange={(e) => onChange(Number(e.target.value))}
      className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-bold text-foreground">
      {options.map((o) => (<option key={o.offset} value={o.offset}>{o.label}</option>))}
    </select>
  );
}
