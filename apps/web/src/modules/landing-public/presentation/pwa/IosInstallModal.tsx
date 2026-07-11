import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { GlassCard } from "@landing-public/primitives/GlassCard";

const STEPS = ["lpIosModalStep1", "lpIosModalStep2", "lpIosModalStep3"] as const;

// Tutorial de instalación para iOS Safari (que no dispara beforeinstallprompt). 3 pasos con emoji.
export function IosInstallModal({ open, onClose, displayName }: { open: boolean; onClose: () => void; displayName: string }) {
  const { t } = useI18n();
  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="ios-install-title" onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm">
        <GlassCard elevation="xl" padding="lg">
          <div className="flex items-start justify-between gap-4">
            <h2 id="ios-install-title" className="font-display text-lg font-bold">{t("lpIosModalTitle", { name: displayName })}</h2>
            <button type="button" onClick={onClose} aria-label={t("lpIosModalClose")}><X className="h-5 w-5" /></button>
          </div>
          <ol className="mt-4 space-y-3 text-sm">
            {STEPS.map((s, i) => <li key={s} className="flex gap-2"><span className="font-bold">{i + 1}.</span>{t(s, { name: displayName })}</li>)}
          </ol>
          <button type="button" onClick={onClose} className="mt-6 w-full rounded-lg py-2 font-bold text-white" style={{ background: "hsl(var(--tenant-primary-hsl))" }}>{t("lpIosModalClose")}</button>
        </GlassCard>
      </div>
    </div>
  );
}
