// Formatea un monto a string de moneda (default USD). null/undefined → "" (el consumidor oculta el bloque). 0 → "$0.00".
export function formatPrice(amount: number | null | undefined, currency = "USD"): string {
  if (amount == null) return "";
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(Number(amount) || 0);
}
