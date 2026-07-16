import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import { ContactFormCard } from "@landing-public/presentation/contact/ContactFormCard";

// Popup del form de contacto (home): ScreenModal (Portal) + el ContactFormCard existente. Mismo lead, misma lógica.
export function ContactPopup({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  return (
    <ScreenModal onClose={onClose}>
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/85 p-4 backdrop-blur">
        <h2 className="font-display text-lg font-bold text-foreground">{t("lpContactTitle")}</h2>
        <button type="button" onClick={onClose} aria-label={t("opClose")}><X className="h-6 w-6" /></button>
      </div>
      <div className="p-4">
        <p className="mb-4 text-sm text-[color:hsl(var(--lp-muted))]">{t("lpContactSubtitle")}</p>
        <ContactFormCard />
      </div>
    </ScreenModal>
  );
}
