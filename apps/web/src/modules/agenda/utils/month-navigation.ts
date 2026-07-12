import { getMondayOf, addDays } from "@agenda/utils/week-navigation";

export function addMonths(d: Date, n: number): Date { const x = new Date(d); x.setMonth(x.getMonth() + n, 1); x.setHours(0, 0, 0, 0); return x; }

// Matriz de semanas (arrays de 7 días, empezando lunes) que cubren el mes de monthDate, con padding.
export function monthMatrix(monthDate: Date): Date[][] {
  const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  let cursor = getMondayOf(first);
  const weeks: Date[][] = [];
  for (let w = 0; w < 6; w++) {
    weeks.push(Array.from({ length: 7 }, (_, i) => addDays(cursor, i)));
    cursor = addDays(cursor, 7);
    if (cursor.getMonth() !== monthDate.getMonth() && cursor > new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1)) break;
  }
  return weeks;
}
