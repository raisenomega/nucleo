import { useState } from "react";
import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import { useFaqForm } from "@landing/presentation/faq-modal.hooks";
import { FaqBasicInfoSection } from "@landing/presentation/FaqBasicInfoSection";
import { FaqMetaSection } from "@landing/presentation/FaqMetaSection";
import type { LandingFaq, FaqInput } from "@landing/domain/landing-faq.types";

export function FaqModal({ initial, onSave, onClose }: {
  initial?: LandingFaq; onSave: (i: FaqInput) => Promise<void>; onClose: () => void;
}) {
  const { t } = useI18n();
  const { form, set, canSave } = useFaqForm(initial);
  const [busy, setBusy] = useState(false);
  async function submit() { setBusy(true); await onSave(form); setBusy(false); }
  return (
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-display text-lg font-bold text-foreground">{initial ? t("edit") : t("newFaq")}</h2>
        <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
      </div>
      <div className="space-y-4 p-4 text-foreground">
        <FaqBasicInfoSection form={form} set={set} />
        <FaqMetaSection form={form} set={set} />
        <button type="button" disabled={busy || !canSave} onClick={() => void submit()}
          className="rounded-lg bg-primary px-4 py-2 font-bold text-primary-foreground disabled:opacity-50">{busy ? t("sending") : t("save")}</button>
      </div>
    </ScreenModal>
  );
}
