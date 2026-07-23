import type { ParsedCsv } from "@shared/lib/csv";
import type { ColumnMap, DateFormat, ParsedLine } from "@finance/domain/bank-statement.types";

// Lógica pura de mapeo CSV → líneas estructuradas. Sin efectos ni supabase (capa domain).
const HINTS = {
  date: /fecha|date|posted/i, description: /desc|concept|detalle|memo|narrat/i,
  amount: /amount|monto|importe/i, debit: /debit|d[eé]bito|cargo|withdraw/i,
  credit: /credit|cr[eé]dito|abono|deposit/i, balance: /balance|saldo/i, ref: /ref|cheque|check|conf/i,
};
const find = (h: string[], re: RegExp) => h.findIndex((c) => re.test(c));

export function guessMap(headers: string[]): ColumnMap {
  const debit = find(headers, HINTS.debit); const credit = find(headers, HINTS.credit);
  return {
    date: Math.max(0, find(headers, HINTS.date)), description: Math.max(0, find(headers, HINTS.description)),
    amountMode: debit >= 0 && credit >= 0 ? "split" : "signed",
    amount: find(headers, HINTS.amount), debit, credit,
    balance: find(headers, HINTS.balance), ref: find(headers, HINTS.ref), dateFormat: "MDY",
  };
}

function toNum(s: string | undefined): number {
  if (!s) return 0;
  const neg = /^\(.*\)$/.test(s.trim());
  const v = Number(s.replace(/[^0-9.-]/g, "")) || 0;
  return neg ? -Math.abs(v) : v;
}

function toIso(s: string, fmt: DateFormat): string | null {
  const p = s.trim().split(/[/\-.]/).map((x) => x.trim());
  if (p.length !== 3) return null;
  const [a, b, c] = p as [string, string, string];
  let y: string, m: string, d: string;
  if (fmt === "YMD") { y = a; m = b; d = c; } else if (fmt === "DMY") { d = a; m = b; y = c; } else { m = a; d = b; y = c; }
  if (y.length === 2) y = "20" + y;
  const iso = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : null;
}

export function mapRows(csv: ParsedCsv, map: ColumnMap): ParsedLine[] {
  const at = (row: string[], i: number) => (i >= 0 ? row[i] ?? "" : "");
  return csv.rows.map((row): ParsedLine | null => {
    const txn = toIso(at(row, map.date), map.dateFormat);
    if (!txn) return null;
    const amount = map.amountMode === "signed" ? toNum(at(row, map.amount)) : toNum(at(row, map.credit)) - toNum(at(row, map.debit));
    const raw = csv.headers.reduce<Record<string, string>>((o, h, i) => { o[h] = row[i] ?? ""; return o; }, {});
    return { txn_date: txn, description: at(row, map.description), amount,
      running_balance: map.balance >= 0 ? toNum(at(row, map.balance)) : null,
      external_ref: map.ref >= 0 ? at(row, map.ref) || null : null, raw };
  }).filter((l): l is ParsedLine => l !== null);
}
