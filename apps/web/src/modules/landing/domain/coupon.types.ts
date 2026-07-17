// BC landing — cupones (tenant_coupons). CRUD del panel CEO. El motor de precios/redención vive en RPCs (no aquí).
export interface Coupon {
  readonly id: string; readonly code: string; readonly discountType: "percentage" | "fixed"; readonly value: number;
  readonly appliesToKind: string; readonly maxUses: number | null; readonly currentUses: number;
  readonly expiresAt: string | null; readonly isActive: boolean;
}
export type CouponDraft = {
  code: string; discountType: "percentage" | "fixed"; value: number;
  appliesToKind: string; maxUses: number | null; expiresAt: string | null; isActive: boolean;
};
export type CouponResult = { ok: true } | { ok: false; error: string };

export interface ICouponRepository {
  list(): Promise<readonly Coupon[]>;
  save(tenantId: string, id: string | null, d: CouponDraft): Promise<CouponResult>;
  remove(id: string): Promise<CouponResult>;
}
