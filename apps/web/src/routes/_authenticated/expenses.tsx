import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { supabase } from "@shared/lib/supabase";
import { useI18n } from "@shared/i18n";
import { useExpense } from "@finance/application/useExpense.hook";
import { supabaseExpenseRepository } from "@finance/infrastructure/supabase-expense.repository";
import { ExpenseForm } from "@finance/presentation/ExpenseForm";
import { ExpenseTable } from "@finance/presentation/ExpenseTable";
import { ExpenseDetail } from "@finance/presentation/ExpenseDetail";
import type { ExpenseFormData } from "@finance/domain/expense.types";

export const Route = createFileRoute("/_authenticated/expenses")({ component: ExpensePage });

type Cat = { id: string; label: string; kind: string };

function ExpensePage() {
  const { t } = useI18n();
  const { expenses, create, update, remove } = useExpense(supabaseExpenseRepository);
  const [cats, setCats] = useState<Cat[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [viewing, setViewing] = useState<string | null>(null);

  useEffect(() => {
    void supabase.from("categories").select("id,label,kind").in("kind", ["expense", "payment_method"])
      .then(({ data }) => setCats((data as Cat[] | null) ?? []));
  }, []);

  const editRow = useMemo<ExpenseFormData | undefined>(() => {
    const i = expenses.find((x) => x.id === editing);
    return i ? { categoryId: i.categoryId, amount: i.amount, description: i.description,
      date: i.date, paymentMethodId: i.paymentMethodId, evidenceUrls: i.evidenceUrls } : undefined;
  }, [editing, expenses]);

  async function submit(d: ExpenseFormData) {
    if (editing && editing !== "new") await update(editing, d); else await create(d);
    setEditing(null);
  }

  const viewExpense = expenses.find((i) => i.id === viewing);
  return (
    <div className="space-y-6 p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary">{t("expenses")}</h1>
          <p className="text-xs text-muted-foreground">{t("expenseSubtitle")}</p>
        </div>
        <button type="button" onClick={() => setEditing("new")}
          className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 font-body font-bold">
          <Plus className="h-4 w-4" /> {t("newExpense")}
        </button>
      </div>
      {editing !== null && (
        <ExpenseForm expenseCats={cats.filter((c) => c.kind === "expense")}
          payCats={cats.filter((c) => c.kind === "payment_method")}
          initial={editRow} onSubmit={submit} onCancel={() => setEditing(null)} />
      )}
      <ExpenseTable rows={expenses} onView={setViewing} onEdit={setEditing}
        onDelete={(id) => { if (window.confirm(`${t("delete")}?`)) void remove(id); }} />
      {viewExpense && <ExpenseDetail expense={viewExpense} onClose={() => setViewing(null)} />}
    </div>
  );
}
