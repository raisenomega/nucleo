import { useState } from "react";
import { Download } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useInstallPrompt } from "@landing-public/pwa/useInstallPrompt.hook";
import { IosInstallModal } from "@landing-public/presentation/pwa/IosInstallModal";

// Botón "Instalar app": SIEMPRE visible salvo si ya está instalada (standalone). Prompt nativo si está listo;
// si no (iOS, desktop, o ya se dismisseó) → modal con instrucciones por plataforma. Así el cliente siempre puede reinstalar.
export function InstallButton({ displayName, variant = "nav" }: { displayName: string; variant?: "nav" | "link" }) {
  const { t } = useI18n();
  const { ready, isInstalled, promptInstall } = useInstallPrompt();
  const [modal, setModal] = useState(false);
  if (isInstalled) return null;
  const onClick = () => { if (ready) void promptInstall(); else setModal(true); };
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
