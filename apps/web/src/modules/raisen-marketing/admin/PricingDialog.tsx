import { useEffect, useState } from "react";
import type { PricingTierDraft, PricingTierRow } from "@raisen-marketing/data/pricing.types";

const EMPTY: PricingTierDraft = { nameEs: "", nameEn: "", price: 0, currency: "USD", billingPeriod: "month", taglineEs: "", taglineEn: "", featuresEs: [], featuresEn: [], ctaLabelEs: "Empezar", ctaLabelEn: "Get started", ctaHref: "#lead-form", isRecommended: false, isActive: true, displayOrder: 0 };
const F = "w-full rounded-lg border border-border bg-background p-2 text-sm text-foreground";

// Modal crear/editar plan (bilingüe). Features uno-por-línea (el repo limpia vacíos). Recomendado exclusivo:
// al guardar con recomendado=true el repo desmarca los demás. Precio number, período select.
export function PricingDialog({ initial, onClose, onSave }: { initial: PricingTierRow | null; onClose: () => void; onSave: (t: PricingTierDraft) => void }) {
  const [d, setD] = useState<PricingTierDraft>(EMPTY);
  useEffect(() => setD(initial ?? EMPTY), [initial]);
  const set = (p: Partial<PricingTierDraft>) => setD((x) => ({ ...x, ...p }));
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-lg space-y-3 overflow-y-auto rounded-xl border border-border bg-card p-5" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-lg font-bold text-foreground">{d.id ? "Editar" : "Nuevo"} plan</h2>
        <div className="grid grid-cols-2 gap-2">
          <input className={F} placeholder="Nombre ES" value={d.nameEs} onChange={(e) => set({ nameEs: e.target.value })} />
          <input className={F} placeholder="Nombre EN" value={d.nameEn} onChange={(e) => set({ nameEn: e.target.value })} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <label className="text-xs text-muted-foreground">Precio<input type="number" className={F} value={d.price} onChange={(e) => set({ price: Number(e.target.value) })} /></label>
          <label className="text-xs text-muted-foreground">Moneda<select className={F} value={d.currency} onChange={(e) => set({ currency: e.target.value })}><option value="USD">USD</option></select></label>
          <label className="text-xs text-muted-foreground">Período<select className={F} value={d.billingPeriod} onChange={(e) => set({ billingPeriod: e.target.value })}><option value="month">mes</option><option value="year">año</option><option value="one_time">único</option></select></label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input className={F} placeholder="Tagline ES" value={d.taglineEs} onChange={(e) => set({ taglineEs: e.target.value })} />
          <input className={F} placeholder="Tagline EN" value={d.taglineEn} onChange={(e) => set({ taglineEn: e.target.value })} />
          <textarea className={F} rows={4} placeholder="Features ES (uno por línea)" value={d.featuresEs.join("\n")} onChange={(e) => set({ featuresEs: e.target.value.split("\n") })} />
          <textarea className={F} rows={4} placeholder="Features EN (uno por línea)" value={d.featuresEn.join("\n")} onChange={(e) => set({ featuresEn: e.target.value.split("\n") })} />
          <input className={F} placeholder="CTA ES" value={d.ctaLabelEs} onChange={(e) => set({ ctaLabelEs: e.target.value })} />
          <input className={F} placeholder="CTA EN" value={d.ctaLabelEn} onChange={(e) => set({ ctaLabelEn: e.target.value })} />
        </div>
        <input className={F} placeholder="CTA href (#lead-form)" value={d.ctaHref} onChange={(e) => set({ ctaHref: e.target.value })} />
        <div className="flex items-center gap-6 text-sm text-foreground">
          <label className="flex items-center gap-2"><input type="checkbox" checked={d.isRecommended} onChange={(e) => set({ isRecommended: e.target.checked })} />Recomendado</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={d.isActive} onChange={(e) => set({ isActive: e.target.checked })} />Activo</label>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => onSave(d)} className="flex-1 rounded-lg bg-primary py-2 text-sm font-bold text-primary-foreground">Guardar</button>
          <button type="button" onClick={onClose} className="rounded-lg bg-secondary px-4 py-2 text-sm text-foreground">Cancelar</button>
        </div>
      </div>
    </div>
  );
}
