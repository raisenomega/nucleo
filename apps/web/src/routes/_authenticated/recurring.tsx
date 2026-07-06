import { useMemo, useState } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { useRecurringExpenses } from "@finance/application/useRecurringExpenses.hook";
import { supabaseRecurringRepository } from "@finance/infrastructure/supabase-recurring.repository";
import { RecurringExpenseTable } from "@finance/presentation/RecurringExpenseTable";
import { RecurringExpenseForm } from "@finance/presentation/RecurringExpenseForm";
import { RecurringPayModal } from "@finance/presentation/RecurringPayModal";
import type { RecurringExpenseFormData } from "@finance/domain/recurring-expense.types";

export const Route = createFileRoute("/_authenticated/recurring")({ component: RecurringPage });

function RecurringPage() {
  const { t } = useI18n();
  const { can } = useModuleAccess();
  const month = new Date().toISOString().slice(0, 7);
  const m = useRecurringExpenses(supabaseRecurringRepository, month);
  const [editing, setEditing] = useState<string | null>(null);
  const [paying, setPaying] = useState<string | null>(null);

  const editRow = useMemo<RecurringExpenseFormData | undefined>(() => {
    const i = m.items.find((x) => x.id === editing);
    return i ? { categoryId: i.categoryId, label: i.label, budgetedAmount: i.budgetedAmount, frequency: i.frequency } : undefined;
  }, [editing, m.items]);

  async function submit(d: RecurringExpenseFormData) {
    await m.save(editing && editing !== "new" ? editing : null, d);
    setEditing(null);
  }

  if (!can("recurring", "view")) return <Navigate to="/dashboard" />;
  return (
    <div className="space-y-6 p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary">{t("recurringExpenses")}</h1>
          <p className="text-xs text-muted-foreground">{t("recurringSubtitle")}</p>
        </div>
        {can("recurring", "create") && <button type="button" onClick={() => setEditing("new")} className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 font-body font-bold">
          <Plus className="h-4 w-4" /> {t("addRecurring")}
        </button>}
      </div>
      <RecurringExpenseTable items={m.items} paid={m.paid} onEdit={can("recurring", "edit") ? setEditing : undefined}
        onPay={can("recurring", "create") ? setPaying : undefined}
        onDelete={can("recurring", "delete") ? (id) => { if (window.confirm(`${t("delete")}?`)) void m.remove(id); } : undefined} />
      {editing !== null && <RecurringExpenseForm initial={editRow} onSubmit={submit} onCancel={() => setEditing(null)} />}
      {paying && <RecurringPayModal categoryId={paying} onClose={() => setPaying(null)} onDone={() => { setPaying(null); void m.refresh(); }} />}
    </div>
  );
}
