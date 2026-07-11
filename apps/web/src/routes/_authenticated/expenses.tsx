import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { supabase } from "@shared/lib/supabase";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { useExpense } from "@finance/application/useExpense.hook";
import { supabaseExpenseRepository } from "@finance/infrastructure/supabase-expense.repository";
import { FinanceReportButton } from "@finance/presentation/FinanceReportButton";
import { expenseReportBody } from "@finance/presentation/finance-reports";
import { ExpenseForm } from "@finance/presentation/ExpenseForm";
import { ExpenseTable } from "@finance/presentation/ExpenseTable";
import { ExpenseDetail } from "@finance/presentation/ExpenseDetail";
import type { ExpenseFormData } from "@finance/domain/expense.types";

export const Route = createFileRoute("/_authenticated/expenses")({
  component: ExpensePage,
  validateSearch: (s: Record<string, unknown>): { category?: string } => ({ category: typeof s.category === "string" ? s.category : undefined }),
});

type Cat = { id: string; label: string; kind: string; expense_class?: string | null };
type Emp = { id: string; full_name: string };

function ExpensePage() {
  const { t } = useI18n(); const { can } = useModuleAccess();
  const { category } = Route.useSearch();
  const { expenses, create, update, voidRow, remove } = useExpense(supabaseExpenseRepository);
  const [cats, setCats] = useState<Cat[]>([]);
  const [emps, setEmps] = useState<Emp[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [viewing, setViewing] = useState<string | null>(null);

  useEffect(() => { if (category && can("expenses", "create")) setEditing("new"); }, [category, can]);

  useEffect(() => {
    void supabase.from("categories").select("id,label,kind,expense_class").in("kind", ["expense", "payment_method"])
      .then(({ data }) => setCats((data as Cat[] | null) ?? []));
    void supabase.from("profiles").select("id, full_name")
      .then(({ data }) => setEmps((data as Emp[] | null) ?? []));
  }, []);

  const editRow = useMemo<ExpenseFormData | undefined>(() => {
    if (editing === "new") return category ? { categoryId: category, amount: 0, description: "", date: "", paymentMethodId: "", paidBy: "", evidenceUrls: [] } : undefined;
    const i = expenses.find((x) => x.id === editing);
    return i ? { categoryId: i.categoryId, amount: i.amount, description: i.description, date: i.date, paymentMethodId: i.paymentMethodId, paidBy: i.paidBy, evidenceUrls: i.evidenceUrls } : undefined;
  }, [editing, expenses, category]);

  async function submit(d: ExpenseFormData) {
    if (editing && editing !== "new") await update(editing, d); else await create(d);
    setEditing(null);
  }

  if (!can("expenses", "view")) return <Navigate to="/dashboard" />;
  const viewExpense = expenses.find((i) => i.id === viewing);
  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-display text-xl font-bold text-foreground md:text-3xl">{t("expenses")}</h1>
          <div className="flex items-center gap-2">
            <FinanceReportButton title={t("expenses")} makeBody={(f, to) => expenseReportBody(expenses, f, to)} />
            {can("expenses", "create") && <button type="button" onClick={() => setEditing("new")} className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm font-body font-bold"><Plus className="h-4 w-4" /> {t("newExpense")}</button>}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{t("expenseSubtitle")}</p>
      </div>
      {editing !== null && (
        <ExpenseForm expenseCats={cats.filter((c) => c.kind === "expense").map((c) => ({ id: c.id, label: c.label, expenseClass: c.expense_class }))}
          payCats={cats.filter((c) => c.kind === "payment_method")} employees={emps} initial={editRow} onSubmit={submit} onCancel={() => setEditing(null)} />)}
      <ExpenseTable rows={expenses} employees={emps} classOf={(id) => cats.find((c) => c.id === id)?.expense_class ?? null} onView={setViewing} onEdit={can("expenses", "edit") ? setEditing : undefined}
        onVoid={voidRow} onDeleteForever={remove} />
      {viewExpense && <ExpenseDetail expense={viewExpense} employees={emps} onClose={() => setViewing(null)} />}
    </div>
  );
}
