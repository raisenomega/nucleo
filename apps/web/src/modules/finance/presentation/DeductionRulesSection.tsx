import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, RotateCcw } from "lucide-react";
import { useToast } from "@shared/providers/toast-context";
import { deductionRulesRepository as repo } from "@finance/infrastructure/deduction-rules.repository";
import type { DeductionRule, DeductionRuleDraft } from "@finance/domain/deduction-rule.types";
import { DeductionRuleDialog } from "@finance/presentation/DeductionRuleDialog";

// Sección "Reglas de deducción" dentro de /payroll (gate can("payroll","edit")). CRUD + reorder + toggle +
// "Restaurar preset PR" (siembra las 10 reglas estándar para tenants con 0). Autocontenida.
export function DeductionRulesSection() {
  const toast = useToast();
  const [items, setItems] = useState<DeductionRule[]>([]);
  const [edit, setEdit] = useState<{ open: boolean; initial: DeductionRule | null }>({ open: false, initial: null });
  const reload = () => void repo.list().then(setItems);
  useEffect(reload, []);
  const done = (e: string | null) => { if (e) toast.error(e); else reload(); };
  const onSave = async (d: DeductionRuleDraft) => { const e = await repo.save(d); if (e) return toast.error(e); setEdit({ open: false, initial: null }); toast.success("Guardado"); reload(); };
  const move = async (i: number, dir: -1 | 1) => {
    const a = items[i], b = items[i + dir]; if (!a || !b) return;
    await repo.setFields(a.id, { sort: b.sort }); done(await repo.setFields(b.id, { sort: a.sort }));
  };
  const restore = async () => {
    if (!window.confirm("Agregará las reglas fiscales estándar de PR (FICA, Medicare, SINOT, ISR, PRUI, FUTA…). ¿Continuar?")) return;
    const e = await repo.restorePreset(); if (e) toast.error(e); else { toast.success("Preset PR restaurado"); reload(); }
  };
  return (
    <div className="space-y-2 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg font-bold text-foreground">Reglas de deducción ({items.length})</h2>
        <div className="flex gap-2">
          <button type="button" onClick={() => void restore()} className="inline-flex items-center gap-1 rounded-lg bg-secondary px-3 py-2 text-sm font-medium text-foreground"><RotateCcw className="h-4 w-4" />Restaurar preset PR</button>
          <button type="button" onClick={() => setEdit({ open: true, initial: null })} className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground"><Plus className="h-4 w-4" />Nueva</button>
        </div>
      </div>
      {items.map((r, i) => (
        <div key={r.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{r.label}</p>
            <p className="text-xs text-muted-foreground">{r.applies_to} · {r.calc_type === "percentage" ? `${r.rate}%` : `$${r.rate}`}{r.wage_cap ? ` · cap $${r.wage_cap.toLocaleString()}` : ""}</p>
          </div>
          <button type="button" onClick={() => void move(i, -1)} disabled={i === 0} aria-label="subir" className="rounded p-1 text-muted-foreground disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
          <button type="button" onClick={() => void move(i, 1)} disabled={i === items.length - 1} aria-label="bajar" className="rounded p-1 text-muted-foreground disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
          <label className="flex items-center gap-1 text-xs text-muted-foreground"><input type="checkbox" checked={r.active} onChange={(e) => void repo.setFields(r.id, { active: e.target.checked }).then(done)} />activa</label>
          <button type="button" onClick={() => setEdit({ open: true, initial: r })} aria-label="editar" className="rounded p-1 text-muted-foreground hover:text-foreground"><Pencil className="h-4 w-4" /></button>
          <button type="button" onClick={() => { if (window.confirm(`¿Eliminar "${r.label}"?`)) void repo.remove(r.id).then(done); }} aria-label="eliminar" className="rounded p-1 text-destructive"><Trash2 className="h-4 w-4" /></button>
        </div>
      ))}
      {edit.open && <DeductionRuleDialog initial={edit.initial} onClose={() => setEdit({ open: false, initial: null })} onSave={onSave} />}
    </div>
  );
}
