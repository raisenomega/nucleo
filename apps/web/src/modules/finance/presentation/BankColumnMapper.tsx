import type { ColumnMap, AmountMode, DateFormat } from "@finance/domain/bank-statement.types";

// Paso 2 del import: mapear qué columna del CSV es cada campo (-1 = ninguna). No hardcodea ningún banco.
export function BankColumnMapper({ headers, sample, map, onChange }: {
  headers: string[]; sample: string[]; map: ColumnMap; onChange: (m: ColumnMap) => void;
}) {
  const set = (k: keyof ColumnMap, v: number | string) => onChange({ ...map, [k]: v });
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  const lbl = "text-xs font-bold text-muted-foreground";
  const opts = (allowNone: boolean) => (
    <>{allowNone && <option value={-1}>—</option>}{headers.map((h, i) => <option key={i} value={i}>{h || `Col ${i + 1}`}{sample[i] ? ` · ${sample[i].slice(0, 14)}` : ""}</option>)}</>
  );
  const sel = (k: keyof ColumnMap, label: string, allowNone = false) => (
    <label className="space-y-1"><span className={lbl}>{label}</span>
      <select value={map[k] as number} onChange={(e) => set(k, Number(e.target.value))} className={fld}>{opts(allowNone)}</select></label>
  );
  return (
    <div className="grid grid-cols-2 gap-3">
      {sel("date", "Fecha")}
      <label className="space-y-1"><span className={lbl}>Formato de fecha</span>
        <select value={map.dateFormat} onChange={(e) => set("dateFormat", e.target.value as DateFormat)} className={fld}>
          <option value="MDY">MM/DD/AAAA</option><option value="DMY">DD/MM/AAAA</option><option value="YMD">AAAA-MM-DD</option></select></label>
      {sel("description", "Descripción")}
      <label className="space-y-1"><span className={lbl}>Monto</span>
        <select value={map.amountMode} onChange={(e) => set("amountMode", e.target.value as AmountMode)} className={fld}>
          <option value="signed">Una columna (firmada)</option><option value="split">Dos columnas (débito/crédito)</option></select></label>
      {map.amountMode === "signed" ? sel("amount", "Columna de monto")
        : <>{sel("debit", "Débito (sale)")}{sel("credit", "Crédito (entra)")}</>}
      {sel("balance", "Balance (opcional)", true)}
      {sel("ref", "Referencia (opcional)", true)}
    </div>
  );
}
