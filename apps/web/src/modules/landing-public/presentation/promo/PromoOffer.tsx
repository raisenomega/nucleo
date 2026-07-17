import { useEffect, useState } from "react";
import { useI18n } from "@shared/i18n";
import { isReady } from "@shared/types/fetch-state.types";
import { OrderModal } from "@orders-public/presentation/OrderModal";
import { useLandingHome } from "@landing-public/presentation/useLandingHome.hook";
import { useLandingCatalogItems } from "@landing-public/presentation/useLandingCatalogItems.hook";
import { PromoPopup } from "@landing-public/presentation/promo/PromoPopup";
import { PromoToast } from "@landing-public/presentation/promo/PromoToast";
import type { PromoOffer as Offer } from "@landing-public/domain/promo-offer.types";

const SEEN = "promoSeen";
// Orquesta la oferta: popup auto (delay 2.5s, 1 vez por sesión vía sessionStorage), toast flotante persistente, y el
// OrderModal del servicio vinculado con el cupón pre-aplicado. Se monta en PublicLandingRoot.
export function PromoOffer() {
  const { t } = useI18n();
  const home = useLandingHome();
  const heroObj = isReady(home) ? home.data.hero : null;
  const offer = (heroObj?.promo_offer ?? null) as Offer | null;
  const cat = useLandingCatalogItems();
  const svc = offer?.service_id ? (isReady(cat) ? cat.data.services : []).find((s) => s.id === offer.service_id) : undefined;
  const [view, setView] = useState<"popup" | "toast" | "order" | null>(null);
  const active = offer?.is_active === true;
  useEffect(() => {
    if (!active) return;
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(SEEN) === "1") return void setView("toast");
    if (offer?.auto_show) { const h = setTimeout(() => setView("popup"), 2500); return () => clearTimeout(h); }
    setView("toast");
  }, [active, offer?.auto_show]);
  if (!active || !offer) return null;
  const markSeen = () => { try { sessionStorage.setItem(SEEN, "1"); } catch { /* ignore */ } };
  return (
    <>
      {view === "popup" && <PromoPopup offer={offer} onClose={() => { markSeen(); setView("toast"); }} onCta={() => { markSeen(); setView(svc ? "order" : "toast"); }} />}
      {view === "toast" && <PromoToast text={offer.toast_text || t("promoTrendingDefault")} onClick={() => setView(svc ? "order" : "popup")} />}
      {view === "order" && svc && <OrderModal item={{ kind: "service", id: svc.id, name: svc.name, basePrice: svc.price ?? 0 }} defaultCoupon={offer.coupon_code ?? null}
        promoContext={{ title: offer.title, subtitle: offer.price_line || offer.badge, helper: offer.description, summaryLine: offer.summary_line, includedLine: offer.included_line, includedLabel: offer.included_label, totalLabel: offer.total_label, recurringNote: offer.recurring_note, termsText: offer.terms_text, termsLabel: offer.terms_label }} onClose={() => setView("toast")} />}
    </>
  );
}
