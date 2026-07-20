import { useEffect, useState } from "react";
import type { PricingAddonDraft, PricingAddonRow } from "@raisen-marketing/data/pricing.types";

const EMPTY: PricingAddonDraft = { nameEs: "", nameEn: "", descEs: "", descEn: "", price: 0, currency: "USD", billingPeriod: "month", isActive: true, displayOrder: 0 };
const F = "w-full rounded-lg border border-border bg-background p-2 text-sm text-foreground";

// Modal crear/editar add-on (complemento). Bilingüe + precio/moneda/período. Réplica del de OMEGA.
export function AddonDialog({ initial, onClose, onSave }: { initial: PricingAddonRow | null; onClose: () => void; onSave: (a: PricingAddonDraft) => void }) {
  const [d, setD] = useState<PricingAddonDraft>(EMPTY);
  useEffect(() => setD(initial ?? EMPTY), [initial]);
  const set = (p: Partial<PricingAddonDraft>) => setD((x) => ({ ...x, ...p }));
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-lg space-y-3 overflow-y-auto rounded-xl border border-border bg-card p-5" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-lg font-bold text-foreground">{d.id ? "Editar" : "Nuevo"} add-on</h2>
        <div className="grid grid-cols-2 gap-2">
          <input className={F} placeholder="Nombre ES" value={d.nameEs} onChange={(e) => set({ nameEs: e.target.value })} />
          <input className={F} placeholder="Nombre EN" value={d.nameEn} onChange={(e) => set({ nameEn: e.target.value })} />
          <textarea className={F} rows={2} placeholder="Descripción ES" value={d.descEs} onChange={(e) => set({ descEs: e.target.value })} />
          <textarea className={F} rows={2} placeholder="Descripción EN" value={d.descEn} onChange={(e) => set({ descEn: e.target.value })} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <label className="text-xs text-muted-foreground">Precio<input type="number" className={F} value={d.price} onChange={(e) => set({ price: Number(e.target.value) })} /></label>
          <label className="text-xs text-muted-foreground">Moneda<select className={F} value={d.currency} onChange={(e) => set({ currency: e.target.value })}><option value="USD">USD</option></select></label>
          <label className="text-xs text-muted-foreground">Período<select className={F} value={d.billingPeriod} onChange={(e) => set({ billingPeriod: e.target.value })}><option value="month">mes</option><option value="year">año</option><option value="one_time">único</option></select></label>
        </div>
        <label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={d.isActive} onChange={(e) => set({ isActive: e.target.checked })} />Activo</label>
        <div className="flex gap-2">
          <button type="button" onClick={() => onSave(d)} className="flex-1 rounded-lg bg-primary py-2 text-sm font-bold text-primary-foreground">Guardar</button>
          <button type="button" onClick={onClose} className="rounded-lg bg-secondary px-4 py-2 text-sm text-foreground">Cancelar</button>
        </div>
      </div>
    </div>
  );
}
