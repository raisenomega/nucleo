import { useState } from "react";
import { formatCurrency } from "@shared/lib/format";
import type { RecordPayment } from "@billing/infrastructure/invoice-payments.repository";

const F = "w-full rounded-lg border border-border bg-background p-2 text-sm text-foreground";
const today = () => new Date().toISOString().slice(0, 10);

// Registrar un pago (parcial o total). Monto default = balance restante; no puede exceder el balance (anti-sobrepago).
export function PaymentDialog({ invoiceId, balance, onClose, onSave }: {
  invoiceId: string; balance: number; onClose: () => void; onSave: (p: RecordPayment) => void;
}) {
  const [amount, setAmount] = useState(String(balance));
  const [date, setDate] = useState(today());
  const [reference, setReference] = useState(""); const [notes, setNotes] = useState("");
  const amt = Number(amount);
  const invalid = !(amt > 0) || amt > balance + 0.01;
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-sm space-y-2 rounded-xl border border-border bg-card p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-lg font-bold text-foreground">Registrar pago</h3>
        <p className="text-xs text-muted-foreground">Balance pendiente: <span className="font-bold text-foreground">{formatCurrency(balance)}</span></p>
        <label className="block space-y-1"><span className="text-xs font-bold text-muted-foreground">Monto</span>
          <input type="number" min={0} max={balance} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className={F} /></label>
        {amt > balance + 0.01 && <p className="text-xs font-bold text-red-600">El monto no puede exceder el balance.</p>}
        <label className="block space-y-1"><span className="text-xs font-bold text-muted-foreground">Fecha</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={F} /></label>
        <input className={F} placeholder="Referencia (confirmación, cheque…)" value={reference} onChange={(e) => setReference(e.target.value)} />
        <input className={F} placeholder="Notas" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <div className="flex gap-2 pt-1">
          <button type="button" disabled={invalid} onClick={() => onSave({ invoice_id: invoiceId, amount: amt, payment_date: date, reference: reference || undefined, notes: notes || undefined })}
            className="flex-1 rounded-lg bg-primary py-2 text-sm font-bold text-primary-foreground disabled:opacity-40">Registrar</button>
          <button type="button" onClick={onClose} className="rounded-lg bg-secondary px-4 py-2 text-sm text-foreground">Cancelar</button>
        </div>
      </div>
    </div>
  );
}
