import { useState } from "react";
import { SEGMENT_DEFAULT_COLOR, type CustomerSegment, type SegPayload } from "@shared/customers/customer-segments.repository";

const F = "w-full rounded-lg border border-border bg-background p-2 text-sm text-foreground";
const PT = [["", "— sin término default —"], ["immediate", "Inmediato"], ["net_15", "Net 15"], ["net_30", "Net 30"], ["net_60", "Net 60"], ["net_90", "Net 90"]] as const;
const blank = (): SegPayload => ({ name: "", description: "", color: SEGMENT_DEFAULT_COLOR, default_discount_pct: 0, default_payment_terms: "", is_active: true });

// Alta/edición de un segmento comercial (nombre, color, descuento y término default que hereda el cliente).
export function SegmentDialog({ initial, onClose, onSave }: { initial: CustomerSegment | null; onClose: () => void; onSave: (p: SegPayload) => void }) {
  const [d, setD] = useState<SegPayload>(initial ? { id: initial.id, name: initial.name, description: initial.description, color: initial.color, default_discount_pct: initial.defaultDiscountPct, default_payment_terms: initial.defaultPaymentTerms ?? "", is_active: initial.isActive } : blank());
  const set = (p: SegPayload) => setD((x) => ({ ...x, ...p }));
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-sm space-y-2 rounded-xl border border-border bg-card p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-lg font-bold text-foreground">{initial ? "Editar" : "Nuevo"} segmento</h3>
        <input className={F} placeholder="Nombre * (VIP, Mayorista…)" value={String(d.name ?? "")} onChange={(e) => set({ name: e.target.value })} />
        <input className={F} placeholder="Descripción" value={String(d.description ?? "")} onChange={(e) => set({ description: e.target.value })} />
        <div className="grid grid-cols-2 gap-2">
          <label className="flex items-center gap-2 text-sm text-foreground">Color <input type="color" value={String(d.color || SEGMENT_DEFAULT_COLOR)} onChange={(e) => set({ color: e.target.value })} className="h-9 w-full rounded border border-border bg-background" /></label>
          <label className="flex items-center gap-2 text-sm text-foreground">Desc. %<input type="number" min={0} max={100} step="0.01" className={F} value={Number(d.default_discount_pct ?? 0)} onChange={(e) => set({ default_discount_pct: Number(e.target.value) })} /></label>
        </div>
        <select className={F} value={String(d.default_payment_terms ?? "")} onChange={(e) => set({ default_payment_terms: e.target.value })}>{PT.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        <label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={d.is_active !== false} onChange={(e) => set({ is_active: e.target.checked })} />Activo</label>
        <div className="flex gap-2 pt-1">
          <button type="button" disabled={!String(d.name ?? "").trim()} onClick={() => onSave(d)} className="flex-1 rounded-lg bg-primary py-2 text-sm font-bold text-primary-foreground disabled:opacity-40">Guardar</button>
          <button type="button" onClick={onClose} className="rounded-lg bg-secondary px-4 py-2 text-sm text-foreground">Cancelar</button>
        </div>
      </div>
    </div>
  );
}
