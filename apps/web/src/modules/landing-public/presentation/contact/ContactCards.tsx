import { useState } from "react";
import { MessageSquare, CalendarCheck } from "lucide-react";
import { useI18n } from "@shared/i18n";
import type { TranslationKey } from "@shared/i18n";
import { isReady } from "@shared/types/fetch-state.types";
import { GlassCard } from "@landing-public/primitives/GlassCard";
import { FloatingButton } from "@landing-public/primitives/FloatingButton";
import { ContactPopup } from "@landing-public/presentation/contact/ContactPopup";
import { OrderModal } from "@orders-public/presentation/OrderModal";
import { useLandingCatalogItems } from "@landing-public/presentation/useLandingCatalogItems.hook";

type Card = { icon: typeof MessageSquare; title: TranslationKey; sub: TranslationKey; btn: TranslationKey; go: () => void; off?: boolean };

// Home: 2 cards de contacto. "Contáctanos" → ContactPopup (mensaje). "Coordinar una visita" → OrderModal del servicio
// Evaluación (form real del catálogo: select tipo $80/$200/$260/$500 + pricing preview + submit). Reusa el order system.
export function ContactCards() {
  const { t } = useI18n();
  const cat = useLandingCatalogItems();
  const ev = (isReady(cat) ? cat.data.services : []).find((s) => s.slug === "evaluacion");
  const [open, setOpen] = useState<"contact" | "visit" | null>(null);
  const cards: Card[] = [
    { icon: MessageSquare, title: "lpContactCardTitle", sub: "lpContactCardSub", btn: "lpContactCardBtn", go: () => setOpen("contact") },
    { icon: CalendarCheck, title: "lpVisitCardTitle", sub: "lpVisitCardSub", btn: "lpVisitCardBtn", go: () => setOpen("visit"), off: !ev },
  ];
  return (
    <>
      <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2">
        {cards.map((c) => (
          <GlassCard key={c.title} elevation="lg" padding="lg" className="flex flex-col items-start gap-3 text-left">
            <c.icon className="h-8 w-8 text-primary" aria-hidden />
            <h3 className="text-lg font-bold text-[color:hsl(var(--lp-fg))]">{t(c.title)}</h3>
            <p className="text-sm text-[color:hsl(var(--lp-muted))]">{t(c.sub)}</p>
            <FloatingButton variant="primary" onClick={c.go} disabled={c.off} className="mt-auto">{t(c.btn)}</FloatingButton>
          </GlassCard>
        ))}
      </div>
      {open === "contact" && <ContactPopup onClose={() => setOpen(null)} />}
      {open === "visit" && ev && <OrderModal item={{ kind: "service", id: ev.id, name: ev.name, basePrice: ev.price ?? 80 }} onClose={() => setOpen(null)} />}
    </>
  );
}
