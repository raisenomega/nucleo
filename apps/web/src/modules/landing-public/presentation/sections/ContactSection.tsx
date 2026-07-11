import { useI18n } from "@shared/i18n";
import { GlassCard } from "@landing-public/primitives/GlassCard";
import { ContactForm } from "@landing-public/presentation/contact/ContactForm";
import { ContactSuccess } from "@landing-public/presentation/contact/ContactSuccess";
import { useCreateLead } from "@landing-public/presentation/useCreateLead.hook";

// Sección de contacto (id=contact): ancla del CTA del hero, FinalCta y las cards. Crea lead en el CRM.
export function ContactSection() {
  const { t } = useI18n();
  const lead = useCreateLead();
  return (
    <section id="contact" className="mx-auto max-w-2xl px-6 py-16">
      <h2 style={{ fontSize: "var(--text-h2)" }} className="mb-2 text-center font-bold">{t("lpContactTitle")}</h2>
      <p className="mb-6 text-center text-[color:hsl(var(--lp-muted))]">{t("lpContactSubtitle")}</p>
      <GlassCard elevation="lg" padding="lg">
        {lead.status === "success"
          ? <ContactSuccess message={lead.confirmationMessage} onReset={lead.reset} />
          : <ContactForm onSubmit={lead.submit} submitting={lead.status === "submitting"} errorCode={lead.status === "error" ? lead.errorCode : undefined} />}
      </GlassCard>
    </section>
  );
}
