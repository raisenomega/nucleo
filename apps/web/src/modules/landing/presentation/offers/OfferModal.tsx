import { useState } from "react";
import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import { useOfferForm } from "@landing/presentation/offers/useOfferForm.hook";
import { OfferFields } from "@landing/presentation/offers/OfferFields";
import { OfferServicesPicker } from "@landing/presentation/offers/OfferServicesPicker";
import { OfferPreview } from "@landing/presentation/offers/OfferPreview";
import type { Offer, OfferInput } from "@landing/domain/landing-offer.types";

export function OfferModal({ initial, onSave, onClose }: {
  initial?: Offer; onSave: (input: OfferInput) => Promise<void>; onClose: () => void;
}) {
  const { t } = useI18n();
  const { form, set } = useOfferForm(initial);
  const [busy, setBusy] = useState(false);
  async function submit() { setBusy(true); await onSave(form); setBusy(false); }
  return (
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-display text-lg font-bold text-foreground">{initial ? t("edit") : t("landingOffersNew")}</h2>
        <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
      </div>
      <div className="space-y-4 p-4 text-foreground">
        <OfferFields c={form} set={set} />
        <OfferServicesPicker c={form} set={set} />
        <OfferPreview c={form} />
        <button type="button" disabled={busy} onClick={() => void submit()}
          className="rounded-lg bg-primary px-4 py-2 font-bold text-primary-foreground disabled:opacity-50">{busy ? t("sending") : t("save")}</button>
      </div>
    </ScreenModal>
  );
}
