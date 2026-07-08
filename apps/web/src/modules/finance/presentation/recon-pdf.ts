import type { ReconciliationSnapshot } from "@finance/domain/reconciliation.types";

// Body de POST /pdf/reconciliation (template dedicado): el snapshot COMPLETO viaja al pdf-api —
// banco por cuenta + obligaciones fiscales + retención mensual + resumen ejecutivo + salud.
// El RPC del snapshot depende de los claims del JWT, así que el backend no puede re-fetchearlo.
export function buildFiscalBody(month: string, s: ReconciliationSnapshot) {
  return { month, bank: s.bank, tax: s.tax, retention: s.retention, summary: s.summary };
}
