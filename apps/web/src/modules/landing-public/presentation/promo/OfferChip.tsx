import { useState } from "react";
import { useI18n } from "@shared/i18n";
import { isReady } from "@shared/types/fetch-state.types";
import { OrderModal } from "@orders-public/presentation/OrderModal";
import { useLandingCatalogItems } from "@landing-public/presentation/useLandingCatalogItems.hook";
import { useActiveOffer } from "@landing-public/presentation/promo/useActiveOffer.hook";
import { OfferServiceSelector } from "@landing-public/presentation/promo/OfferServiceSelector";

// Chip flotante de la oferta activa (reemplaza el PromoOffer legacy). Click → selector de servicio (si aplica) →
// OrderModal con offerContext (disclosure + checkbox). Se monta en PublicLandingRoot. No renderiza si no hay oferta.
export function OfferChip() {
  const { locale } = useI18n();
  const offer = useActiveOffer();
  const cat = useLandingCatalogItems();
  const [view, setView] = useState<"select" | "order" | null>(null);
  const [svcId, setSvcId] = useState<string | null>(null);
  if (!offer) return null;
  const services = (isReady(cat) ? cat.data.services : []).filter((s) => offer.applicable_services.includes(s.id));
  const badge = locale === "en" ? offer.badge_text_en : offer.badge_text_es;
  const openOrder = (id: string) => { setSvcId(id); setView("order"); };
  const onChip = () => { if (offer.ask_service_type && services.length > 1) setView("select"); else if (services[0]) openOrder(services[0].id); };
  const svc = services.find((s) => s.id === svcId);
  const offerCtx = { offerId: offer.id, hookPrice: offer.hook_price, commitmentCycles: offer.commitment_cycles, disclosure: locale === "en" ? offer.disclosure_en : offer.disclosure_es, terms: locale === "en" ? offer.terms_en : offer.terms_es };
  return (
    <>
      <button type="button" onClick={onChip} aria-label={badge}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-lg">🔥 {badge}</button>
      {view === "select" && <OfferServiceSelector offer={offer} services={services} onPick={openOrder} onClose={() => setView(null)} />}
      {view === "order" && svc && <OrderModal item={{ kind: "service", id: svc.id, name: svc.name, basePrice: svc.price ?? 0 }} offerContext={offerCtx} onClose={() => setView(null)} />}
    </>
  );
}
