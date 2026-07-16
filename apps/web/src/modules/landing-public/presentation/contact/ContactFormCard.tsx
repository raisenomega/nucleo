import { GlassCard } from "@landing-public/primitives/GlassCard";
import { ContactForm } from "@landing-public/presentation/contact/ContactForm";
import { ContactSuccess } from "@landing-public/presentation/contact/ContactSuccess";
import { useCreateLead } from "@landing-public/presentation/useCreateLead.hook";
import type { InterestedItem } from "@landing-public/domain/interested-item.types";

// Card con el form de contacto (crea lead vía _public_create_lead). Reusable: inline en detail pages (con
// preselectedItem → lead 'quote') y dentro del ContactPopup del home. Extraído del antiguo ContactSection.
export function ContactFormCard({ preselectedItem }: { preselectedItem?: InterestedItem }) {
  const lead = useCreateLead();
  return (
    <GlassCard elevation="lg" padding="lg">
      {lead.status === "success"
        ? <ContactSuccess message={lead.confirmationMessage} onReset={lead.reset} />
        : <ContactForm onSubmit={lead.submit} submitting={lead.status === "submitting"} errorCode={lead.status === "error" ? lead.errorCode : undefined} preselectedItem={preselectedItem} />}
    </GlassCard>
  );
}
