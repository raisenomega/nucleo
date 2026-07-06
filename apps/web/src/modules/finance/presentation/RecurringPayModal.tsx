import { useEffect, useState } from "react";
import { supabase } from "@shared/lib/supabase";
import { ScreenModal } from "@shared/components/ScreenModal";
import { supabaseExpenseRepository } from "@finance/infrastructure/supabase-expense.repository";
import { ExpenseForm } from "@finance/presentation/ExpenseForm";
import type { ExpenseFormData } from "@finance/domain/expense.types";

type Cat = { id: string; label: string; kind: string; expense_class?: string | null };
type Emp = { id: string; full_name: string };

// Registra el pago de un gasto fijo sin salir de /recurring: reutiliza ExpenseForm en modal.
export function RecurringPayModal({ categoryId, onClose, onDone }: {
  categoryId: string; onClose: () => void; onDone: () => void;
}) {
  const [cats, setCats] = useState<Cat[]>([]);
  const [emps, setEmps] = useState<Emp[]>([]);
  useEffect(() => {
    void supabase.from("categories").select("id,label,kind,expense_class").in("kind", ["expense", "payment_method"])
      .then(({ data }) => setCats((data as Cat[] | null) ?? []));
    void supabase.from("profiles").select("id, full_name").then(({ data }) => setEmps((data as Emp[] | null) ?? []));
  }, []);
  const initial: ExpenseFormData = { categoryId, amount: 0, description: "", date: new Date().toISOString().slice(0, 10), paymentMethodId: "", paidBy: "", evidenceUrls: [] };
  async function submit(d: ExpenseFormData) { await supabaseExpenseRepository.create(d); onDone(); }
  return (
    <ScreenModal onClose={onClose}>
      <ExpenseForm expenseCats={cats.filter((c) => c.kind === "expense").map((c) => ({ id: c.id, label: c.label, expenseClass: c.expense_class }))}
        payCats={cats.filter((c) => c.kind === "payment_method")} employees={emps}
        initial={initial} onSubmit={submit} onCancel={onClose} />
    </ScreenModal>
  );
}
