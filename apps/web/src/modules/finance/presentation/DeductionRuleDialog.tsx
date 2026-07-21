import { useEffect, useState } from "react";
import type { DeductionRule, DeductionRuleDraft } from "@finance/domain/deduction-rule.types";

const EMPTY: DeductionRuleDraft = { label: "", applies_to: "employee", calc_type: "percentage", rate: 0,
  base_source: "gross_salary", wage_cap: null, per_employee: false, frequency: "per_pay_period", country_code: "PR", notes: null, sort: 99, active: true };
const F = "w-full rounded-lg border border-border bg-background p-2 text-sm text-foreground";
const L = "text-xs text-muted-foreground";

// Modal crear/editar regla de deducción. Aquí el CEO configura el ISR (poner su rate) y actualiza los caps.
export function DeductionRuleDialog({ initial, onClose, onSave }: { initial: DeductionRule | null; onClose: () => void; onSave: (d: DeductionRuleDraft) => void }) {
  const [d, setD] = useState<DeductionRuleDraft>(EMPTY);
  useEffect(() => setD(initial ?? EMPTY), [initial]);
  const set = (p: Partial<DeductionRuleDraft>) => setD((x) => ({ ...x, ...p }));
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-lg space-y-3 overflow-y-auto rounded-xl border border-border bg-card p-5" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-lg font-bold text-foreground">{d.id ? "Editar" : "Nueva"} regla</h2>
        <input className={F} placeholder="Nombre (ej: Contribución PR ISR)" value={d.label} onChange={(e) => set({ label: e.target.value })} />
        <div className="grid grid-cols-2 gap-2">
          <label className={L}>Aplica a<select className={F} value={d.applies_to} onChange={(e) => set({ applies_to: e.target.value as DeductionRule["applies_to"] })}><option value="employee">Empleado</option><option value="employer">Patrono</option><option value="contractor">Contratista</option></select></label>
          <label className={L}>Cálculo<select className={F} value={d.calc_type} onChange={(e) => set({ calc_type: e.target.value as DeductionRule["calc_type"] })}><option value="percentage">Porcentaje</option><option value="fixed_amount">Monto fijo</option></select></label>
          <label className={L}>{d.calc_type === "percentage" ? "Tasa %" : "Monto $"}<input type="number" step="0.01" className={F} value={d.rate} onChange={(e) => set({ rate: Number(e.target.value) })} /></label>
          <label className={L}>Cap anual (vacío = sin tope)<input type="number" step="0.01" className={F} value={d.wage_cap ?? ""} onChange={(e) => set({ wage_cap: e.target.value === "" ? null : Number(e.target.value) })} /></label>
          <label className={L}>Base<select className={F} value={d.base_source} onChange={(e) => set({ base_source: e.target.value as DeductionRule["base_source"] })}><option value="gross_salary">Salario bruto</option><option value="gross_payroll">Nómina bruta</option><option value="contract_payment">Pago contrato</option><option value="fixed">Fijo</option></select></label>
          <label className={L}>Frecuencia<select className={F} value={d.frequency} onChange={(e) => set({ frequency: e.target.value as DeductionRule["frequency"] })}><option value="per_pay_period">Por período</option><option value="monthly">Mensual</option><option value="quarterly">Trimestral</option><option value="annual">Anual</option></select></label>
        </div>
        <textarea className={F} rows={2} placeholder="Notas (opcional)" value={d.notes ?? ""} onChange={(e) => set({ notes: e.target.value || null })} />
        <div className="flex gap-2">
          <button type="button" onClick={() => onSave(d)} className="flex-1 rounded-lg bg-primary py-2 text-sm font-bold text-primary-foreground">Guardar</button>
          <button type="button" onClick={onClose} className="rounded-lg bg-secondary px-4 py-2 text-sm text-foreground">Cancelar</button>
        </div>
      </div>
    </div>
  );
}
