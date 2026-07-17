import { useState } from "react";
import { Navigate } from "@tanstack/react-router";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useI18n } from "@shared/i18n";
import type { TranslationKey } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { Spinner } from "@shared/components/loading/Spinner";
import { useCoupons } from "@landing/application/useCoupons.hook";
import { supabaseCouponsRepository } from "@landing/infrastructure/supabase-coupons.repository";
import { CouponForm } from "@landing/presentation/coupons-admin/CouponForm";
import type { Coupon } from "@landing/domain/coupon.types";

export function CouponsListPage() {
  const { t } = useI18n(); const { can } = useModuleAccess();
  const { coupons, loading, save, remove } = useCoupons(supabaseCouponsRepository);
  const [editing, setEditing] = useState<Coupon | "new" | null>(null);
  if (!can("settings", "edit")) return <Navigate to="/dashboard" />;
  async function del(c: Coupon) {
    if (c.currentUses > 0) return void window.alert(t("couponInUse", { n: c.currentUses }));
    if (!window.confirm(t("couponDeleteConfirm", { code: c.code }))) return;
    const r = await remove(c.id); if (!r.ok) window.alert(r.error);
  }
  const badge = (c: Coupon) => {
    const exp = c.expiresAt != null && new Date(c.expiresAt) < new Date();
    const full = c.maxUses != null && c.currentUses >= c.maxUses;
    const [k, cls]: [TranslationKey, string] = !c.isActive ? ["couponInactive", "bg-secondary text-muted-foreground"]
      : exp ? ["couponExpired", "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300"]
      : full ? ["couponFull", "bg-secondary text-muted-foreground"] : ["couponActive", "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300"];
    return <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${cls}`}>{t(k)}</span>;
  };
  return (
    <div className="space-y-4 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold text-foreground md:text-3xl">{t("landingCoupons")}</h1>
        <button type="button" onClick={() => setEditing("new")} className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground"><Plus className="h-4 w-4" /> {t("couponNew")}</button>
      </div>
      {loading ? <div className="py-16"><Spinner /></div> : coupons.length === 0 ? <p className="text-sm text-muted-foreground">{t("couponEmpty")}</p> : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-xs uppercase text-muted-foreground"><tr>
              <th className="px-3 py-2 text-left">{t("couponCode")}</th><th className="px-3 py-2 text-left">{t("couponValue")}</th>
              <th className="px-3 py-2 text-left">{t("couponUses")}</th><th className="px-3 py-2 text-left">{t("status")}</th><th className="px-3 py-2 text-right">{t("actions")}</th>
            </tr></thead>
            <tbody>{coupons.map((c) => (
              <tr key={c.id} className="border-t border-border">
                <td className="px-3 py-2 font-mono font-bold">{c.code}</td>
                <td className="px-3 py-2">{c.discountType === "percentage" ? `${c.value}%` : `$${c.value.toFixed(2)}`}</td>
                <td className="px-3 py-2">{c.currentUses}/{c.maxUses ?? "∞"}</td>
                <td className="px-3 py-2">{badge(c)}</td>
                <td className="px-3 py-2"><div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setEditing(c)} aria-label={t("edit")}><Pencil className="h-4 w-4" /></button>
                  <button type="button" onClick={() => void del(c)} aria-label={t("delete")} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div></td>
              </tr>))}
            </tbody>
          </table>
        </div>)}
      {editing && <CouponForm initial={editing === "new" ? undefined : editing} onSave={(d) => save(editing === "new" ? null : editing.id, d)} onClose={() => setEditing(null)} />}
    </div>
  );
}
