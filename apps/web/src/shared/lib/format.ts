// Formato de moneda. Por ahora USD; a futuro configurable por tenant (settings.currency).
export function formatCurrency(n: number): string {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
