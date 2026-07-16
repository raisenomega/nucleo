import { useState } from "react";
import { MessageSquare, CalendarCheck } from "lucide-react";
import { useI18n } from "@shared/i18n";
import type { TranslationKey } from "@shared/i18n";
import { GlassCard } from "@landing-public/primitives/GlassCard";
import { FloatingButton } from "@landing-public/primitives/FloatingButton";
import { ContactPopup } from "@landing-public/presentation/contact/ContactPopup";
import { EvaluationRequestPopup } from "@landing-public/presentation/contact/EvaluationRequestPopup";

type Card = { icon: typeof MessageSquare; title: TranslationKey; sub: TranslationKey; btn: TranslationKey; go: () => void };

// Home: 2 cards de contacto. "Contáctanos" → ContactPopup (mensaje). "Coordinar una visita" → EvaluationRequestPopup
// (solicitud de Evaluación $80). Reusa GlassCard + FloatingButton + ScreenModal. Sin card de Evaluación aparte.
export function ContactCards() {
  const { t } = useI18n();
  const [open, setOpen] = useState<"contact" | "visit" | null>(null);
  const cards: Card[] = [
    { icon: MessageSquare, title: "lpContactCardTitle", sub: "lpContactCardSub", btn: "lpContactCardBtn", go: () => setOpen("contact") },
    { icon: CalendarCheck, title: "lpVisitCardTitle", sub: "lpVisitCardSub", btn: "lpVisitCardBtn", go: () => setOpen("visit") },
  ];
  return (
    <>
      <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2">
        {cards.map((c) => (
          <GlassCard key={c.title} elevation="lg" padding="lg" className="flex flex-col items-start gap-3 text-left">
            <c.icon className="h-8 w-8 text-primary" aria-hidden />
            <h3 className="text-lg font-bold text-[color:hsl(var(--lp-fg))]">{t(c.title)}</h3>
            <p className="text-sm text-[color:hsl(var(--lp-muted))]">{t(c.sub)}</p>
            <FloatingButton variant="primary" onClick={c.go} className="mt-auto">{t(c.btn)}</FloatingButton>
          </GlassCard>
        ))}
      </div>
      {open === "contact" && <ContactPopup onClose={() => setOpen(null)} />}
      {open === "visit" && <EvaluationRequestPopup onClose={() => setOpen(null)} />}
    </>
  );
}
