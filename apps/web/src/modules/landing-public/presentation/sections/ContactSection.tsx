import { useI18n } from "@shared/i18n";
import { ContactCards } from "@landing-public/presentation/contact/ContactCards";
import { ContactFormCard } from "@landing-public/presentation/contact/ContactFormCard";
import type { InterestedItem } from "@landing-public/domain/interested-item.types";

// Sección de contacto (id=contact): ancla del CTA del hero y las cards. En el home muestra 3 cards con popups
// (contacto + visita + evaluación). En las detail pages (preselectedItem) mantiene el form inline → lead 'quote'.
export function ContactSection({ preselectedItem }: { preselectedItem?: InterestedItem }) {
  const { t } = useI18n();
  return (
    <section id="contact" className="mx-auto max-w-5xl px-6 py-16">
      <h2 style={{ fontSize: "var(--text-h2)" }} className="mb-2 text-center font-bold">{t("lpContactTitle")}</h2>
      <p className="mb-8 text-center text-[color:hsl(var(--lp-muted))]">{t("lpContactSubtitle")}</p>
      {preselectedItem
        ? <div className="mx-auto max-w-2xl"><ContactFormCard preselectedItem={preselectedItem} /></div>
        : <ContactCards />}
    </section>
  );
}
