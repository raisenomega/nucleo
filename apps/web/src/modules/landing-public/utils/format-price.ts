// Formatea un monto a string de moneda (default USD). Sin dependencias externas.
export function formatPrice(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(Number(amount) || 0);
}
