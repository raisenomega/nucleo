import { useI18n } from "@shared/i18n";
import { ContactCards } from "@landing-public/presentation/contact/ContactCards";
import { ContactFormCard } from "@landing-public/presentation/contact/ContactFormCard";
import type { InterestedItem } from "@landing-public/domain/interested-item.types";
import type { ContactConfig } from "@landing-public/domain/contact-config.types";

// Sección de contacto (id=contact): ancla del CTA del hero y las cards. Config CMS: se puede ocultar la sección
// entera o cada tarjeta. En detail pages (preselectedItem) mantiene el form inline → lead 'quote'.
export function ContactSection({ preselectedItem, contactConfig }: { preselectedItem?: InterestedItem; contactConfig?: ContactConfig | null }) {
  const { t } = useI18n();
  const bothOff = contactConfig?.showMessage === false && contactConfig?.showVisit === false;
  if (!preselectedItem && (contactConfig?.enabled === false || bothOff)) return null;
  return (
    <section id="contact" className="mx-auto max-w-5xl px-6 py-16">
      <h2 style={{ fontSize: "var(--text-h2)" }} className="mb-2 text-center font-bold">{t("lpContactTitle")}</h2>
      <p className="mb-8 text-center text-[color:hsl(var(--lp-muted))]">{t("lpContactSubtitle")}</p>
      {preselectedItem
        ? <div className="mx-auto max-w-2xl"><ContactFormCard preselectedItem={preselectedItem} /></div>
        : <ContactCards config={contactConfig ?? null} />}
    </section>
  );
}
