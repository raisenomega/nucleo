import { useState } from "react";
import { MessageSquare, CalendarCheck } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { isReady } from "@shared/types/fetch-state.types";
import { GlassCard } from "@landing-public/primitives/GlassCard";
import { FloatingButton } from "@landing-public/primitives/FloatingButton";
import { ContactPopup } from "@landing-public/presentation/contact/ContactPopup";
import { OrderModal } from "@orders-public/presentation/OrderModal";
import { useLandingCatalogItems } from "@landing-public/presentation/useLandingCatalogItems.hook";
import type { ContactConfig } from "@landing-public/domain/contact-config.types";

type Card = { key: string; icon: typeof MessageSquare; title: string; sub: string; btn: string; go: () => void; off?: boolean };

// Home: cards de contacto. "Contáctanos" → ContactPopup (mensaje). "Confirmar visita" → OrderModal del servicio
// Evaluación (form real del catálogo). Config CMS: ocultar cada tarjeta + sobreescribir sus textos (fallback i18n).
export function ContactCards({ config }: { config?: ContactConfig | null }) {
  const { t } = useI18n();
  const cat = useLandingCatalogItems();
  const ev = (isReady(cat) ? cat.data.services : []).find((s) => s.slug === "evaluacion");
  const [open, setOpen] = useState<"contact" | "visit" | null>(null);
  const cards: Card[] = [
    config?.showMessage !== false && { key: "msg", icon: MessageSquare, title: config?.msgTitle || t("lpContactCardTitle"), sub: config?.msgDesc || t("lpContactCardSub"), btn: config?.msgBtn || t("lpContactCardBtn"), go: () => setOpen("contact") },
    config?.showVisit !== false && { key: "visit", icon: CalendarCheck, title: config?.visitTitle || t("lpVisitCardTitle"), sub: config?.visitDesc || t("lpVisitCardSub"), btn: config?.visitBtn || t("lpVisitCardBtn"), go: () => setOpen("visit"), off: !ev },
  ].filter(Boolean) as Card[];
  if (!cards.length) return null;
  const cols = cards.length === 1 ? "max-w-md md:grid-cols-1" : "max-w-3xl md:grid-cols-2";
  return (
    <>
      <div className={`mx-auto grid gap-6 ${cols}`}>
        {cards.map((c) => (
          <GlassCard key={c.key} elevation="lg" padding="lg" className="flex flex-col items-start gap-3 text-left">
            <c.icon className="h-8 w-8 text-primary" aria-hidden />
            <h3 className="text-lg font-bold text-[color:hsl(var(--lp-fg))]">{c.title}</h3>
            <p className="text-sm text-[color:hsl(var(--lp-muted))]">{c.sub}</p>
            <FloatingButton variant="primary" onClick={c.go} disabled={c.off} className="mt-auto">{c.btn}</FloatingButton>
          </GlassCard>
        ))}
      </div>
      {open === "contact" && <ContactPopup onClose={() => setOpen(null)} />}
      {open === "visit" && ev && <OrderModal item={{ kind: "service", id: ev.id, name: ev.name, basePrice: ev.price ?? 80 }} onClose={() => setOpen(null)} />}
    </>
  );
}
