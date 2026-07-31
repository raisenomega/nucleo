import { motion } from "framer-motion";
import { useI18n } from "@shared/i18n";
import { TermsAccordion } from "@orders-public/presentation/TermsAccordion";

export interface OfferCtx { offerId: string; hookPrice: number; commitmentCycles: number; disclosure: string; terms: string }

const money = (n: number) => `$${n.toFixed(2)}`;

// Split de precio (regular tachado + hook grande) + "Ahorras $X" + disclosure + acordeón de términos + checkbox
// OBLIGATORIO. Al aceptar: pulso sutil del precio + glow del bloque + badge "✓ Descuento aplicado" (fade-in, 1 vez).
export function OfferDisclosureBlock({ offer, recurring, accepted, onAccept }: {
  offer: OfferCtx; recurring: number; accepted: boolean; onAccept: (v: boolean) => void;
}) {
  const { t } = useI18n();
  const saves = Math.max(recurring - offer.hookPrice, 0);
  return (
    <div className={`space-y-3 rounded-lg border-2 bg-primary/5 p-3 transition-all duration-300 ${accepted ? "border-primary shadow-md shadow-primary/20" : "border-primary/40"}`}>
      <div className="flex items-end gap-3">
        <motion.span className="text-3xl font-extrabold text-primary" animate={accepted ? { scale: [1, 1.12, 1] } : { scale: 1 }} transition={{ duration: 0.4 }}>{money(offer.hookPrice)}</motion.span>
        {recurring > offer.hookPrice && <span className="text-sm text-muted-foreground line-through">{money(recurring)}</span>}
        {saves > 0 && <span className="ml-auto text-xs font-bold text-green-600">{t("offSave")} {money(saves)}</span>}
      </div>
      <p className="text-xs text-muted-foreground">{t("offFirstCycle")} · {t("offThen")} {money(recurring)} {t("opRecurringSuffix")}</p>
      {offer.disclosure && <p className="text-xs text-muted-foreground">{offer.disclosure}</p>}
      <TermsAccordion terms={offer.terms} />
      <label className={`flex items-start gap-2 rounded-lg p-2 text-xs font-medium text-foreground transition-colors ${accepted ? "bg-primary/10" : ""}`}>
        <input type="checkbox" checked={accepted} onChange={(e) => onAccept(e.target.checked)} className="mt-0.5" />
        {t("offAcceptRead")}
      </label>
      {accepted && (
        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          className="text-center text-xs font-bold text-green-600">✓ {t("offDiscountApplied")}</motion.p>
      )}
    </div>
  );
}
