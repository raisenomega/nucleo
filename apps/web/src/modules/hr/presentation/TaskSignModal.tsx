import { useState } from "react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import { SignaturePad } from "@shared/components/SignaturePad";

// Firma de una tarea de onboarding (reutiliza SignaturePad de observaciones).
export function TaskSignModal({ title, onSign, onClose }: { title: string; onSign: (sig: string) => void; onClose: () => void }) {
  const { t } = useI18n();
  const [sig, setSig] = useState("");
  return (
    <ScreenModal onClose={onClose}>
      <div className="space-y-3 p-4 md:p-6">
        <h2 className="font-display text-lg font-bold text-foreground">{title}</h2>
        <SignaturePad onChange={setSig} />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg bg-secondary px-4 py-2 text-sm font-bold">{t("cancel")}</button>
          <button type="button" disabled={!sig} onClick={() => { onSign(sig); onClose(); }} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">{t("signContract")}</button>
        </div>
      </div>
    </ScreenModal>
  );
}
