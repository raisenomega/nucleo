import { useState } from "react";
import { X, Sparkles } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import type { Coupon, CouponDraft, CouponResult } from "@landing/domain/coupon.types";

const KINDS = ["all", "product", "service", "package"] as const;
const CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const genCode = () => Array.from({ length: 8 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join("");
const empty: CouponDraft = { code: "", discountType: "percentage", value: 10, appliesToKind: "all", maxUses: null, expiresAt: null, isActive: true };

export function CouponForm({ initial, onSave, onClose }: { initial?: Coupon; onSave: (d: CouponDraft) => Promise<CouponResult>; onClose: () => void }) {
  const { t } = useI18n();
  const [f, setF] = useState<CouponDraft>(initial ? { code: initial.code, discountType: initial.discountType, value: initial.value, appliesToKind: initial.appliesToKind, maxUses: initial.maxUses, expiresAt: initial.expiresAt, isActive: initial.isActive } : empty);
  const [busy, setBusy] = useState(false);
  const set = (p: Partial<CouponDraft>) => setF((c) => ({ ...c, ...p }));
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  async function submit() {
    if (!f.code.trim() || f.value <= 0) return void window.alert(t("couponErrData"));
    setBusy(true); const r = await onSave(f); setBusy(false);
    if (r.ok) onClose(); else window.alert(r.error);
  }
  return (
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-display text-lg font-bold text-foreground">{initial ? t("couponEdit") : t("couponNew")}</h2>
        <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
      </div>
      <div className="space-y-3 p-4">
        <label className="block text-sm font-medium">{t("couponCode")}
          <div className="mt-1 flex gap-2"><input value={f.code} onChange={(e) => set({ code: e.target.value.toUpperCase() })} className={fld} />
            <button type="button" onClick={() => set({ code: genCode() })} aria-label={t("couponGenerate")} className="shrink-0 rounded-lg border border-border px-3"><Sparkles className="h-4 w-4" /></button></div></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-medium">{t("couponType")}
            <select value={f.discountType} onChange={(e) => set({ discountType: e.target.value as CouponDraft["discountType"] })} className={fld}>
              <option value="percentage">{t("couponPercent")}</option><option value="fixed">{t("couponFixed")}</option></select></label>
          <label className="block text-sm font-medium">{t("couponValue")}
            <input type="number" min={0} step="0.01" value={f.value || ""} onChange={(e) => set({ value: Number(e.target.value) })} className={fld} /></label>
          <label className="block text-sm font-medium">{t("couponMaxUses")}
            <input type="number" min={0} value={f.maxUses ?? ""} placeholder="0" onChange={(e) => set({ maxUses: Number(e.target.value) > 0 ? Number(e.target.value) : null })} className={fld} /></label>
          <label className="block text-sm font-medium">{t("couponExpires")}
            <input type="date" value={f.expiresAt?.slice(0, 10) ?? ""} onChange={(e) => set({ expiresAt: e.target.value || null })} className={fld} /></label>
        </div>
        <label className="block text-sm font-medium">{t("couponAppliesTo")}
          <select value={f.appliesToKind} onChange={(e) => set({ appliesToKind: e.target.value })} className={fld}>{KINDS.map((k) => <option key={k} value={k}>{t(`couponKind_${k}` as "couponKind_all")}</option>)}</select></label>
        <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={f.isActive} onChange={(e) => set({ isActive: e.target.checked })} className="h-4 w-4" /> {t("active")}</label>
        <button type="button" disabled={busy} onClick={() => void submit()} className="w-full rounded-lg bg-primary py-2.5 font-bold text-primary-foreground disabled:opacity-50">{t("save")}</button>
      </div>
    </ScreenModal>
  );
}
