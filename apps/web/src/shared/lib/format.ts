// Formato de moneda. Por ahora USD; a futuro configurable por tenant (settings.currency).
// Null-safe: null/undefined/NaN → 0 (evita crash "reading 'toLocaleString'" en montos nulos).
export function formatCurrency(n: number | null | undefined): string {
  return `$${(Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
