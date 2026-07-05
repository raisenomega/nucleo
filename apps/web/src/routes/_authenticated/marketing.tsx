import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { supabase } from "@shared/lib/supabase";
import { useI18n } from "@shared/i18n";
import { useRoleGate } from "@shared/hooks/useRoleGate";
import { useMarketing } from "@crm/application/useMarketing.hook";
import { supabaseBudgetRepository } from "@crm/infrastructure/supabase-budget.repository";
import { supabaseMExpenseRepository } from "@crm/infrastructure/supabase-marketing-expense.repository";
import { supabaseMarketingSnapshotRepository } from "@crm/infrastructure/supabase-marketing-snapshot.repository";
import { MarketingKpis } from "@crm/presentation/MarketingKpis";
import { MarketingChart } from "@crm/presentation/MarketingChart";
import { MarketingBudgetTable } from "@crm/presentation/MarketingBudgetTable";
import { MarketingExpenseForm } from "@crm/presentation/MarketingExpenseForm";
import { MarketingExpenseTable } from "@crm/presentation/MarketingExpenseTable";
import { MarketingExpenseDetail } from "@crm/presentation/MarketingExpenseDetail";
import type { MExpenseFormData } from "@crm/domain/marketing.types";

export const Route = createFileRoute("/_authenticated/marketing")({ component: MarketingPage });

const EMPTY_E: MExpenseFormData = { budgetId: "", channel: "", date: "", amount: 0, description: "", campaignName: "", notes: "", evidenceUrls: [] };

function MarketingPage() {
  const { t } = useI18n();
  const { canEdit } = useRoleGate();
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const m = useMarketing(supabaseBudgetRepository, supabaseMExpenseRepository, supabaseMarketingSnapshotRepository, month);
  const [channels, setChannels] = useState<string[]>([]);
  const [editE, setEditE] = useState<string | null>(null);
  const [viewE, setViewE] = useState<string | null>(null);

  useEffect(() => {
    void supabase.from("categories").select("label").eq("kind", "channel").order("sort")
      .then(({ data }) => setChannels((data as { label: string }[] | null)?.map((c) => c.label) ?? []));
  }, []);

  const budgets = m.budgets.filter((b) => b.month.slice(0, 7) === month);
  const expenses = m.expenses.filter((e) => e.date.slice(0, 7) === month);
  const editExpense = useMemo<MExpenseFormData | undefined>(() => {
    if (editE === "new") return EMPTY_E;
    const e = m.expenses.find((x) => x.id === editE);
    return e ? { budgetId: e.budgetId, channel: e.channel, date: e.date, amount: e.amount, description: e.description, campaignName: e.campaignName, notes: e.notes, evidenceUrls: e.evidenceUrls } : undefined;
  }, [editE, m.expenses]);

  async function submitE(d: MExpenseFormData) { await m.saveExpense(editE && editE !== "new" ? editE : null, d); setEditE(null); }
  const viewExpense = m.expenses.find((e) => e.id === viewE);

  return (
    <div className="space-y-6 p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary">{t("marketing")}</h1>
          <p className="text-xs text-muted-foreground">{t("marketingSubtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="rounded-lg border border-border bg-background p-2 text-sm" />
          <button type="button" onClick={() => setEditE("new")} className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 font-body font-bold"><Plus className="h-4 w-4" /> {t("registerExpense")}</button>
        </div>
      </div>
      {m.snapshot && <MarketingKpis s={m.snapshot} />}
      <MarketingChart budgets={budgets} expenses={expenses} channels={channels} />
      <MarketingBudgetTable channels={channels} budgets={budgets} month={month} canEdit={canEdit("coo")}
        onSave={(channel, amount) => { void m.upsertBudget({ month: `${month}-01`, channel, budgetedAmount: amount, notes: "" }); }} />
      <h2 className="font-body font-bold text-primary">{t("mExpenseList")}</h2>
      {editE !== null && editExpense && <MarketingExpenseForm channels={channels} initial={editExpense} onSubmit={submitE} onCancel={() => setEditE(null)} />}
      <MarketingExpenseTable rows={expenses} onView={setViewE} onEdit={setEditE}
        onDelete={(id) => { if (window.confirm(`${t("delete")}?`)) void m.removeExpense(id); }} />
      {viewExpense && <MarketingExpenseDetail item={viewExpense} onClose={() => setViewE(null)} />}
    </div>
  );
}
