import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { MessageSquare, CalendarCheck, ClipboardCheck } from "lucide-react";
import { useI18n } from "@shared/i18n";
import type { TranslationKey } from "@shared/i18n";
import { GlassCard } from "@landing-public/primitives/GlassCard";
import { FloatingButton } from "@landing-public/primitives/FloatingButton";
import { ContactPopup } from "@landing-public/presentation/contact/ContactPopup";
import { VisitRequestPopup } from "@landing-public/presentation/contact/VisitRequestPopup";

type Card = { icon: typeof MessageSquare; title: TranslationKey; sub: TranslationKey; btn: TranslationKey; go: () => void };

// Home: 3 cards de contacto. Escribir mensaje / Coordinar visita → popups (ScreenModal). Evaluación → detail page
// (/service/evaluacion, ya no está en destacados). Reusa GlassCard + FloatingButton + el patrón de popup existente.
export function ContactCards() {
  const { t } = useI18n();
  const nav = useNavigate();
  const [open, setOpen] = useState<"contact" | "visit" | null>(null);
  const cards: Card[] = [
    { icon: MessageSquare, title: "lpContactCardTitle", sub: "lpContactCardSub", btn: "lpContactCardBtn", go: () => setOpen("contact") },
    { icon: CalendarCheck, title: "lpVisitCardTitle", sub: "lpVisitCardSub", btn: "lpVisitCardBtn", go: () => setOpen("visit") },
    { icon: ClipboardCheck, title: "lpEvalCardTitle", sub: "lpEvalCardSub", btn: "lpEvalCardBtn", go: () => void nav({ to: "/service/$slug", params: { slug: "evaluacion" } }) },
  ];
  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
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
      {open === "visit" && <VisitRequestPopup onClose={() => setOpen(null)} />}
    </>
  );
}
