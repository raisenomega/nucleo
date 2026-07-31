import type { OfferInput } from "@landing/domain/landing-offer.types";
import type { SetOffer } from "@landing/presentation/offers/useOfferForm.hook";

const f = "w-full rounded-lg border border-border bg-background p-2 text-sm";
const PAIRS: [keyof OfferInput, keyof OfferInput, string][] = [
  ["titleEs", "titleEn", "Título interno"], ["badgeTextEs", "badgeTextEn", "Texto del chip"],
  ["ctaLabelEs", "ctaLabelEn", "Botón CTA"], ["modalQuestionEs", "modalQuestionEn", "Pregunta del modal"],
];

// Campos escalares/bilingües de la oferta (labels de chrome en ES; el contenido es ES/EN por columnas).
export function OfferFields({ c, set }: { c: OfferInput; set: SetOffer }) {
  const num = (v: string) => (v === "" ? 0 : Number(v));
  return (
    <div className="space-y-3">
      {PAIRS.map(([es, en, label]) => (
        <div key={es}>
          <label className="mb-1 block text-xs font-bold text-muted-foreground">{label}</label>
          <div className="grid grid-cols-2 gap-2">
            <input className={f} placeholder="ES" value={c[es] as string} onChange={(e) => set({ [es]: e.target.value })} />
            <input className={f} placeholder="EN" value={c[en] as string} onChange={(e) => set({ [en]: e.target.value })} />
          </div>
        </div>
      ))}
      <div>
        <label className="mb-1 block text-xs font-bold text-muted-foreground">Disclosure corto (línea bajo el precio)</label>
        <div className="grid grid-cols-2 gap-2">
          <textarea className={f} rows={2} placeholder="ES" value={c.disclosureEs} onChange={(e) => set({ disclosureEs: e.target.value })} />
          <textarea className={f} rows={2} placeholder="EN" value={c.disclosureEn} onChange={(e) => set({ disclosureEn: e.target.value })} />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-bold text-muted-foreground">Términos completos (acordeón · **texto** = negrita)</label>
        <div className="grid grid-cols-2 gap-2">
          <textarea className={f} rows={5} placeholder="Términos ES" value={c.termsEs} onChange={(e) => set({ termsEs: e.target.value })} />
          <textarea className={f} rows={5} placeholder="Terms EN" value={c.termsEn} onChange={(e) => set({ termsEn: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <label className="text-xs font-bold text-muted-foreground">Precio hook<input type="number" step="0.01" min="0" className={f} value={c.hookPrice} onChange={(e) => set({ hookPrice: num(e.target.value) })} /></label>
        <label className="text-xs font-bold text-muted-foreground">Ciclos compromiso<input type="number" min="1" className={f} value={c.commitmentCycles} onChange={(e) => set({ commitmentCycles: num(e.target.value) })} /></label>
        <label className="text-xs font-bold text-muted-foreground">Orden<input type="number" className={f} value={c.displayOrder} onChange={(e) => set({ displayOrder: num(e.target.value) })} /></label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs font-bold text-muted-foreground">Vigente desde<input type="date" className={f} value={c.validFrom?.slice(0, 10) ?? ""} onChange={(e) => set({ validFrom: e.target.value || null })} /></label>
        <label className="text-xs font-bold text-muted-foreground">Vigente hasta<input type="date" className={f} value={c.validUntil?.slice(0, 10) ?? ""} onChange={(e) => set({ validUntil: e.target.value || null })} /></label>
      </div>
      <label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={c.isActive} onChange={(e) => set({ isActive: e.target.checked })} />Activa (visible en la landing)</label>
      <label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={c.askServiceType} onChange={(e) => set({ askServiceType: e.target.checked })} />Preguntar tipo de servicio antes de abrir el pedido</label>
    </div>
  );
}
