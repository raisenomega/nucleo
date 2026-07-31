import { useI18n } from "@shared/i18n";

export interface OfferCtx { offerId: string; hookPrice: number; commitmentCycles: number; disclosure: string }

const money = (n: number) => `$${n.toFixed(2)}`;

// Bloque de oferta en el OrderModal: precio hook + recurrente dinámico + disclosure + checkbox OBLIGATORIO.
export function OfferDisclosureBlock({ offer, recurring, accepted, onAccept }: {
  offer: OfferCtx; recurring: number; accepted: boolean; onAccept: (v: boolean) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="space-y-2 rounded-lg border-2 border-primary/40 bg-primary/5 p-3">
      <p className="text-sm font-bold text-foreground">
        {money(offer.hookPrice)} {t("offFirstCycle")} · {t("offThen")} {money(recurring)} {t("opRecurringSuffix")}
      </p>
      {offer.disclosure && <p className="text-xs text-muted-foreground">{offer.disclosure}</p>}
      <label className="flex items-start gap-2 text-xs font-medium text-foreground">
        <input type="checkbox" checked={accepted} onChange={(e) => onAccept(e.target.checked)} className="mt-0.5" />
        {t("offAcceptPrefix")} {offer.commitmentCycles} {t("offAcceptCycles")}
      </label>
    </div>
  );
}
