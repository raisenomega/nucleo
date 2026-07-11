import { useState } from "react";
import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import { useTestimonialForm } from "@landing/presentation/testimonial-modal.hooks";
import { TestimonialBasicInfoSection } from "@landing/presentation/TestimonialBasicInfoSection";
import { TestimonialAvatarSection } from "@landing/presentation/TestimonialAvatarSection";
import { TestimonialMetaSection } from "@landing/presentation/TestimonialMetaSection";
import type { LandingTestimonial, TestimonialInput } from "@landing/domain/landing-testimonial.types";

export function TestimonialModal({ initial, onSave, onClose }: {
  initial?: LandingTestimonial; onSave: (i: TestimonialInput) => Promise<void>; onClose: () => void;
}) {
  const { t } = useI18n();
  const { form, set, canSave } = useTestimonialForm(initial);
  const [busy, setBusy] = useState(false);
  async function submit() { setBusy(true); await onSave(form); setBusy(false); }
  return (
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-display text-lg font-bold text-foreground">{initial ? t("edit") : t("newTestimonial")}</h2>
        <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
      </div>
      <div className="space-y-4 p-4 text-foreground">
        <TestimonialBasicInfoSection form={form} set={set} />
        <TestimonialAvatarSection form={form} set={set} />
        <TestimonialMetaSection form={form} set={set} />
        <button type="button" disabled={busy || !canSave} onClick={() => void submit()}
          className="rounded-lg bg-primary px-4 py-2 font-bold text-primary-foreground disabled:opacity-50">{busy ? t("sending") : t("save")}</button>
      </div>
    </ScreenModal>
  );
}
