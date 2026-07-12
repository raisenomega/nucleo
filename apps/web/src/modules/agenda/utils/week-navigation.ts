export const pad = (n: number) => String(n).padStart(2, "0");
export const localDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export function addDays(d: Date, n: number): Date { const x = new Date(d); x.setDate(x.getDate() + n); return x; }

// Lunes de la semana que contiene d (00:00 local).
export function getMondayOf(d: Date): Date {
  const x = new Date(d); x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}
export const weekDays = (monday: Date): Date[] => Array.from({ length: 7 }, (_, i) => addDays(monday, i));
export const sameDay = (a: Date, b: Date) => localDate(a) === localDate(b);
