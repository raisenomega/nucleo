import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useMarketing } from "@crm/application/useMarketing.hook";
import { supabaseBudgetRepository } from "@crm/infrastructure/supabase-budget.repository";
import { supabaseMExpenseRepository } from "@crm/infrastructure/supabase-marketing-expense.repository";
import { BudgetForm } from "@crm/presentation/BudgetForm";
import { BudgetTable } from "@crm/presentation/BudgetTable";
import { MarketingExpenseForm } from "@crm/presentation/MarketingExpenseForm";
import { MarketingExpenseTable } from "@crm/presentation/MarketingExpenseTable";
import type { Budget, BudgetFormData, MExpenseFormData } from "@crm/domain/marketing.types";

export const Route = createFileRoute("/_authenticated/marketing")({ component: MarketingPage });

const btn = "flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 font-body font-bold";

function MarketingPage() {
  const { t } = useI18n();
  const m = useMarketing(supabaseBudgetRepository, supabaseMExpenseRepository);
  const [month, setMonth] = useState("");
  const [sel, setSel] = useState<Budget | null>(null);
  const [editB, setEditB] = useState<string | null>(null);
  const [editE, setEditE] = useState<string | null>(null);

  const budgets = m.budgets.filter((b) => !month || b.month.slice(0, 7) === month);
  const expenses = m.expenses.filter((e) => sel && e.channel === sel.channel);
  const editBudget = useMemo<BudgetFormData | undefined>(() => {
    const b = m.budgets.find((x) => x.id === editB);
    return b ? { month: b.month, channel: b.channel, budgetedAmount: b.budgetedAmount, notes: b.notes } : undefined;
  }, [editB, m.budgets]);
  const editExpense = useMemo<MExpenseFormData | undefined>(() => {
    if (editE === "new" && sel) return { budgetId: sel.id, channel: sel.channel, date: "", amount: 0, description: "", campaignName: "", notes: "", evidenceUrls: [] };
    const e = m.expenses.find((x) => x.id === editE);
    return e ? { budgetId: e.budgetId, channel: e.channel, date: e.date, amount: e.amount, description: e.description, campaignName: e.campaignName, notes: e.notes, evidenceUrls: e.evidenceUrls } : undefined;
  }, [editE, m.expenses, sel]);

  async function submitB(d: BudgetFormData) { await m.saveBudget(editB && editB !== "new" ? editB : null, d); setEditB(null); }
  async function submitE(d: MExpenseFormData) { await m.saveExpense(editE && editE !== "new" ? editE : null, d); setEditE(null); }

  return (
    <div className="space-y-6 p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary">{t("marketing")}</h1>
          <p className="text-xs text-muted-foreground">{t("marketingSubtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="rounded-lg border border-border bg-background p-2 text-sm" />
          <button type="button" onClick={() => setEditB("new")} className={btn}><Plus className="h-4 w-4" /> {t("newBudget")}</button>
        </div>
      </div>
      {editB !== null && <BudgetForm initial={editBudget} onSubmit={submitB} onCancel={() => setEditB(null)} />}
      <BudgetTable rows={budgets} onSelect={setSel} onEdit={setEditB}
        onDelete={(id) => { if (window.confirm(`${t("delete")}?`)) void m.removeBudget(id); }} />
      {sel && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-body font-bold text-primary">{sel.channel}</h2>
            <button type="button" onClick={() => setEditE("new")} className={btn}><Plus className="h-4 w-4" /> {t("newMExpense")}</button>
          </div>
          {editE !== null && editExpense && <MarketingExpenseForm initial={editExpense} onSubmit={submitE} onCancel={() => setEditE(null)} />}
          <MarketingExpenseTable rows={expenses} onEdit={setEditE}
            onDelete={(id) => { if (window.confirm(`${t("delete")}?`)) void m.removeExpense(id); }} />
        </div>
      )}
    </div>
  );
}
