import type { Asset } from "@assets/domain/asset.types";

// Valor del activo con fallback: valor actual, si no precio de compra.
export const assetValue = (a: Asset) => a.currentValue ?? a.purchasePrice ?? 0;
export const daysUntil = (d: string | null, now: Date) => (d ? Math.ceil((new Date(d + "T00:00:00").getTime() - now.getTime()) / 864e5) : Infinity);
// Garantía o seguro por vencer en <= days (y no vencido hace mucho).
export const expiringSoon = (a: Asset, now: Date, days = 30) => {
  const w = daysUntil(a.warrantyExpires, now), i = daysUntil(a.insuranceExpires, now);
  return (w <= days && w > -3650) || (i <= days && i > -3650);
};
