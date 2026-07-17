import { supabase } from "@shared/lib/supabase";
import type { ICouponRepository, Coupon, CouponDraft, CouponResult } from "@landing/domain/coupon.types";

const ok = (e: { message: string } | null): CouponResult => (e ? { ok: false, error: e.message } : { ok: true });
const SEL = "id,code,discount_type,value,applies_to_kind,max_uses,current_uses,expires_at,is_active";
type Row = { id: string; code: string; discount_type: string; value: number | string; applies_to_kind: string; max_uses: number | null; current_uses: number; expires_at: string | null; is_active: boolean };

const toCoupon = (r: Row): Coupon => ({
  id: r.id, code: r.code, discountType: r.discount_type === "percentage" ? "percentage" : "fixed", value: Number(r.value),
  appliesToKind: r.applies_to_kind, maxUses: r.max_uses, currentUses: r.current_uses, expiresAt: r.expires_at, isActive: r.is_active,
});
const fromDraft = (d: CouponDraft) => ({
  code: d.code.trim(), discount_type: d.discountType, value: d.value, applies_to_kind: d.appliesToKind,
  max_uses: d.maxUses, expires_at: d.expiresAt || null, is_active: d.isActive,
});

export const supabaseCouponsRepository: ICouponRepository = {
  async list(): Promise<readonly Coupon[]> {
    const { data } = await supabase.from("tenant_coupons").select(SEL).order("created_at", { ascending: false });
    return ((data as Row[] | null) ?? []).map(toCoupon);
  },
  async save(tenantId, id, d): Promise<CouponResult> {
    return ok((id
      ? await supabase.from("tenant_coupons").update(fromDraft(d)).eq("id", id)
      : await supabase.from("tenant_coupons").insert({ tenant_id: tenantId, ...fromDraft(d) })).error);
  },
  async remove(id): Promise<CouponResult> {
    return ok((await supabase.from("tenant_coupons").delete().eq("id", id)).error);
  },
};
