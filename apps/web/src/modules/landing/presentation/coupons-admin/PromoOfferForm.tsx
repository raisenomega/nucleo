import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { supabase } from "@shared/lib/supabase";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import { usePromoOffer } from "@landing/application/usePromoOffer.hook";
import type { PromoOffer } from "@landing-public/domain/promo-offer.types";
import type { Coupon } from "@landing/domain/coupon.types";

type SKey = "badge" | "title" | "description" | "cta_text" | "toast_text" | "price_suffix" | "price_line" | "summary_line" | "included_line" | "included_label" | "total_label" | "recurring_note" | "terms_label";
const SEC = "border-t border-border pt-3 text-xs font-bold uppercase tracking-wider text-muted-foreground";
export function PromoOfferForm({ coupons, onClose }: { coupons: readonly Coupon[]; onClose: () => void }) {
  const { t } = useI18n();
  const { offer, ready, save } = usePromoOffer();
  const [f, setF] = useState<PromoOffer>({});
  const [services, setServices] = useState<{ id: string; name: string }[]>([]);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (ready) setF(offer); }, [ready]);
  useEffect(() => { void supabase.from("tenant_landing_services").select("id,name").eq("is_published", true).then(({ data }) => setServices((data as { id: string; name: string }[] | null) ?? [])); }, []);
  const set = (p: Partial<PromoOffer>) => setF((c) => ({ ...c, ...p }));
  const fld = "mt-1 w-full rounded-lg border border-border bg-background p-2 text-sm";
  const inp = (k: SKey, lbl: string) => <label className="block text-sm font-medium">{lbl}<input value={f[k] ?? ""} onChange={(e) => set({ [k]: e.target.value })} className={fld} /></label>;
  const num = (k: "promo_price" | "regular_price", lbl: string) => <label className="block text-sm font-medium">{lbl}<input type="number" step="0.01" min={0} value={f[k] ?? ""} onChange={(e) => set({ [k]: Number(e.target.value) })} className={fld} /></label>;
  async function submit() { setBusy(true); const okr = await save(f); setBusy(false); if (okr) onClose(); else window.alert(t("spErr")); }
  return (
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-display text-lg font-bold text-foreground">{t("promoOfferTitle")}</h2>
        <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
      </div>
      <div className="space-y-3 p-4">
        {inp("badge", t("promoBadge"))}{inp("title", t("promoTitleField"))}{inp("description", t("promoDescField"))}
        <div className="grid grid-cols-2 gap-3">{num("promo_price", t("promoPriceField"))}{num("regular_price", t("promoRegularField"))}{inp("price_suffix", t("promoSuffixField"))}{inp("cta_text", t("promoCtaField"))}</div>
        <label className="block text-sm font-medium">{t("promoServiceField")}
          <select value={f.service_id ?? ""} onChange={(e) => set({ service_id: e.target.value || null })} className={fld}>
            <option value="">—</option>{services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
        <label className="block text-sm font-medium">{t("promoCouponField")}
          <select value={f.coupon_code ?? ""} onChange={(e) => set({ coupon_code: e.target.value || null })} className={fld}>
            <option value="">—</option>{coupons.map((c) => <option key={c.id} value={c.code}>{c.code}</option>)}</select></label>
        {inp("toast_text", t("promoToastField"))}
        <p className={SEC}>{t("promoSecHeader")}</p>
        {inp("price_line", t("promoPriceLine"))}
        <p className={SEC}>{t("promoSecSummary")}</p>
        {inp("summary_line", t("promoSummaryLine"))}{inp("included_line", t("promoIncludedLine"))}
        <div className="grid grid-cols-2 gap-3">{inp("included_label", t("promoIncludedLabelField"))}{inp("total_label", t("promoTotalLabelField"))}</div>
        {inp("recurring_note", t("promoRecurringNote"))}
        <p className={SEC}>{t("promoSecTerms")}</p>
        {inp("terms_label", t("promoTermsLabelField"))}
        <label className="block text-sm font-medium">{t("promoTermsText")}<textarea value={f.terms_text ?? ""} onChange={(e) => set({ terms_text: e.target.value })} rows={4} className={fld} /></label>
        <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={f.is_active ?? false} onChange={(e) => set({ is_active: e.target.checked })} className="h-4 w-4" /> {t("promoActiveField")}</label>
        <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={f.auto_show ?? false} onChange={(e) => set({ auto_show: e.target.checked })} className="h-4 w-4" /> {t("promoAutoShow")}</label>
        <button type="button" disabled={busy} onClick={() => void submit()} className="w-full rounded-lg bg-primary py-2.5 font-bold text-primary-foreground disabled:opacity-50">{t("save")}</button>
      </div>
    </ScreenModal>
  );
}
