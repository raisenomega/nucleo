import { useState } from "react";
import { Download } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useInstallPrompt } from "@landing-public/pwa/useInstallPrompt.hook";
import { IosInstallModal } from "@landing-public/presentation/pwa/IosInstallModal";

// Botón "Instalar app" (header + footer): click = instalación NATIVA DIRECTA, sin modal (decisión owner #176).
// Chromium: visible solo cuando el navegador ofrece el prompt (ready) → un clic instala. iOS: Apple no permite
// instalación directa por API → modal con los pasos de Safari (única vía). Oculto si ya está instalada.
export function InstallButton({ displayName, variant = "nav" }: { displayName: string; variant?: "nav" | "link" }) {
  const { t } = useI18n();
  const { canInstall, isIOS, isInstalled, promptInstall } = useInstallPrompt();
  const [modal, setModal] = useState(false);
  if (!canInstall || isInstalled) return null;
  const onClick = () => { if (isIOS) setModal(true); else void promptInstall(); };
  const cls = variant === "nav"
    ? "inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--glass-border)] px-2.5 py-2 text-sm font-bold text-[color:hsl(var(--lp-fg))] transition-colors hover:bg-black/5"
    : "inline-flex items-center gap-1.5 hover:underline";
  return (
    <>
      <button type="button" onClick={onClick} aria-label={t("lpInstallButton")} className={cls}>
        <Download className="h-4 w-4" /><span className={variant === "nav" ? "hidden sm:inline" : ""}>{t("lpInstallButton")}</span>
      </button>
      <IosInstallModal open={modal} onClose={() => setModal(false)} displayName={displayName} />
    </>
  );
}
