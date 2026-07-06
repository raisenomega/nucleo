import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { supabase } from "@shared/lib/supabase";
import { useI18n } from "@shared/i18n";
import { useRecurringExpenses } from "@finance/application/useRecurringExpenses.hook";
import { supabaseRecurringRepository } from "@finance/infrastructure/supabase-recurring.repository";
import { RecurringExpenseTable } from "@finance/presentation/RecurringExpenseTable";
import { RecurringExpenseForm } from "@finance/presentation/RecurringExpenseForm";
import type { RecurringExpenseFormData } from "@finance/domain/recurring-expense.types";

export const Route = createFileRoute("/_authenticated/expenses-recurring")({ component: RecurringPage });

type Cat = { id: string; label: string };

function RecurringPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const month = new Date().toISOString().slice(0, 7);
  const m = useRecurringExpenses(supabaseRecurringRepository, month);
  const [cats, setCats] = useState<Cat[]>([]);
  const [editing, setEditing] = useState<string | null>(null);

  useEffect(() => {
    void supabase.from("categories").select("id,label").eq("kind", "expense").eq("expense_class", "fixed")
      .then(({ data }) => setCats((data as Cat[] | null) ?? []));
  }, []);

  const editRow = useMemo<RecurringExpenseFormData | undefined>(() => {
    const i = m.items.find((x) => x.id === editing);
    return i ? { categoryId: i.categoryId, label: i.label, budgetedAmount: i.budgetedAmount, frequency: i.frequency } : undefined;
  }, [editing, m.items]);

  async function submit(d: RecurringExpenseFormData) { await m.save(editing && editing !== "new" ? editing : null, d); setEditing(null); }

  return (
    <div className="space-y-6 p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary">{t("recurringExpenses")}</h1>
          <p className="text-xs text-muted-foreground">{t("recurringSubtitle")}</p>
        </div>
        <button type="button" onClick={() => setEditing("new")} className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 font-body font-bold">
          <Plus className="h-4 w-4" /> {t("addRecurring")}
        </button>
      </div>
      <RecurringExpenseTable items={m.items} paid={m.paid} onEdit={setEditing}
        onPay={(category) => void navigate({ to: "/expenses", search: { category } })}
        onDelete={(id) => { if (window.confirm(`${t("delete")}?`)) void m.remove(id); }} />
      {editing !== null && (
        <RecurringExpenseForm fixedCats={cats} initial={editRow} onSubmit={submit} onCancel={() => setEditing(null)} />
      )}
    </div>
  );
}
