import { useState } from "react";
import { X } from "lucide-react";
import { ScreenModal } from "@shared/components/ScreenModal";
import { formatCurrency } from "@shared/lib/format";
import { CategoryPicker } from "@shared/components/CategoryPicker";
import type { StatementLine } from "@finance/domain/bank-statement.types";

// Línea huérfana (comisión/interés) → crea income/expense con monto/fecha de la línea + concilia. Respeta el period lock.
export function CreateEntryModal({ line, onClose, onConfirm }: {
  line: StatementLine; onClose: () => void; onConfirm: (categoryId: string, paymentMethodId: string) => void;
}) {
  const isExpense = line.amount < 0;
  const [cat, setCat] = useState("");
  const [pm, setPm] = useState("");
  return (
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-display text-lg font-bold text-foreground">Crear {isExpense ? "gasto" : "ingreso"} · {formatCurrency(line.amount)}</h2>
        <button type="button" onClick={onClose} aria-label="Cerrar"><X className="h-6 w-6" /></button>
      </div>
      <div className="space-y-3 p-4">
        <p className="text-xs text-muted-foreground">{line.txnDate} · {line.description}</p>
        <CategoryPicker kind={isExpense ? "expense" : "income"} value={cat} onChange={setCat} label="category" />
        <CategoryPicker kind="payment_method" value={pm} onChange={setPm} label="paymentMethod" />
        <button type="button" disabled={!cat || !pm} onClick={() => onConfirm(cat, pm)} className="w-full rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold disabled:opacity-50">Crear y conciliar</button>
      </div>
    </ScreenModal>
  );
}
