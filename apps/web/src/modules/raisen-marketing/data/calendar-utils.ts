// Utilidades de calendario nativas (sin date-fns/react-day-picker — NÚCLEO evita libs). Trabaja con strings
// YYYY-MM-DD para esquivar líos de zona horaria; el RPC re-valida en la tz del negocio (fuente de verdad).
const pad = (n: number) => String(n).padStart(2, "0");
export const ymd = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`; // m 0-indexado

export function todayStr(): string { const d = new Date(); return ymd(d.getFullYear(), d.getMonth(), d.getDate()); }
export function maxStr(days: number): string { const d = new Date(); d.setDate(d.getDate() + days); return ymd(d.getFullYear(), d.getMonth(), d.getDate()); }

// Grilla de un mes: nº de celdas vacías iniciales (dow del día 1) + celdas {day, dateStr, dow}.
export function monthGrid(year: number, month: number) {
  const leading = new Date(year, month, 1).getDay(); // 0=Dom
  const daysIn = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: daysIn }, (_, i) => ({ day: i + 1, dateStr: ymd(year, month, i + 1), dow: new Date(year, month, i + 1).getDay() }));
  return { leading, cells };
}
