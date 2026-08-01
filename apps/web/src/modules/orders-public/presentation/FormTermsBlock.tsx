import { useI18n } from "@shared/i18n";
import { TermsAccordion } from "@orders-public/presentation/TermsAccordion";

// Contrato firmable a nivel FORM (generaliza el de las ofertas): acordeón + checkbox obligatorio. Se usa cuando el
// pedido NO viene de una oferta pero el form tiene términos. Misma firma digital que el Hook (audit + email).
export function FormTermsBlock({ terms, accepted, onAccept }: {
  terms: string; accepted: boolean; onAccept: (v: boolean) => void;
}) {
  const { t } = useI18n();
  return (
    <div className={`space-y-2 rounded-lg border-2 p-3 transition-colors ${accepted ? "border-primary bg-primary/5" : "border-primary/40"}`}>
      <TermsAccordion terms={terms} />
      <label className="flex items-start gap-2 text-xs font-medium text-foreground">
        <input type="checkbox" checked={accepted} onChange={(e) => onAccept(e.target.checked)} className="mt-0.5" />
        {t("offAcceptRead")}
      </label>
    </div>
  );
}
