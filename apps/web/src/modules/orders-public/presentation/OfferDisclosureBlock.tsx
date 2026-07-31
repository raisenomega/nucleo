import { useI18n } from "@shared/i18n";
import { TermsAccordion } from "@orders-public/presentation/TermsAccordion";

export interface OfferCtx { offerId: string; hookPrice: number; commitmentCycles: number; disclosure: string; terms: string }

const money = (n: number) => `$${n.toFixed(2)}`;

// Bloque de oferta en el OrderModal: split de precio (regular tachado + hook grande) + "Ahorras $X" + disclosure +
// acordeón de términos + checkbox OBLIGATORIO (botón bloqueado hasta aceptar). El recurrente es dinámico (total).
export function OfferDisclosureBlock({ offer, recurring, accepted, onAccept }: {
  offer: OfferCtx; recurring: number; accepted: boolean; onAccept: (v: boolean) => void;
}) {
  const { t } = useI18n();
  const saves = Math.max(recurring - offer.hookPrice, 0);
  return (
    <div className="space-y-3 rounded-lg border-2 border-primary/40 bg-primary/5 p-3">
      <div className="flex items-end gap-3">
        <span className="text-3xl font-extrabold text-primary">{money(offer.hookPrice)}</span>
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
    </div>
  );
}
