import { Trash2 } from "lucide-react";
import { formatCurrency } from "@shared/lib/format";
import type { InvoicePayment } from "@billing/infrastructure/invoice-payments.repository";

// Historial de pagos de una factura + anular (void con motivo, respeta el period lock).
export function PaymentHistory({ payments, canVoid, onVoid }: {
  payments: InvoicePayment[]; canVoid: boolean; onVoid: (id: string) => void;
}) {
  if (payments.length === 0) return <p className="py-2 text-center text-xs text-muted-foreground">Sin pagos registrados.</p>;
  return (
    <div className="space-y-1.5">
      {payments.map((p) => (
        <div key={p.id} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background p-2 text-sm">
          <div className="min-w-0">
            <p className="font-semibold text-foreground">{formatCurrency(p.amount)} <span className="ml-1 text-xs font-normal text-muted-foreground">{p.paymentDate}</span></p>
            {(p.reference || p.notes) && <p className="truncate text-xs text-muted-foreground">{[p.reference, p.notes].filter(Boolean).join(" · ")}</p>}
          </div>
          {canVoid && <button type="button" onClick={() => onVoid(p.id)} aria-label="Anular pago" className="shrink-0 text-red-500/70 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>}
        </div>))}
    </div>
  );
}
