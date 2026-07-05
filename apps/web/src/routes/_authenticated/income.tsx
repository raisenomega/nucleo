import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { supabase } from "@shared/lib/supabase";
import { useI18n } from "@shared/i18n";
import { useIncome } from "@finance/application/useIncome.hook";
import { supabaseIncomeRepository } from "@finance/infrastructure/supabase-income.repository";
import { IncomeForm } from "@finance/presentation/IncomeForm";
import { IncomeTable } from "@finance/presentation/IncomeTable";
import { IncomeDetail } from "@finance/presentation/IncomeDetail";
import type { IncomeFormData } from "@finance/domain/income.types";

export const Route = createFileRoute("/_authenticated/income")({ component: IncomePage });

type Cat = { id: string; label: string; kind: string };

function IncomePage() {
  const { t } = useI18n();
  const { incomes, create, update, remove } = useIncome(supabaseIncomeRepository);
  const [cats, setCats] = useState<Cat[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [viewing, setViewing] = useState<string | null>(null);

  useEffect(() => {
    void supabase.from("categories").select("id,label,kind").in("kind", ["income", "payment_method"])
      .then(({ data }) => setCats((data as Cat[] | null) ?? []));
  }, []);

  const editRow = useMemo<IncomeFormData | undefined>(() => {
    const i = incomes.find((x) => x.id === editing);
    return i ? { categoryId: i.categoryId, amount: i.amount, description: i.description,
      date: i.date, paymentMethodId: i.paymentMethodId, clientReference: i.clientReference,
      orderNumber: i.orderNumber, evidenceUrls: i.evidenceUrls } : undefined;
  }, [editing, incomes]);

  async function submit(d: IncomeFormData) {
    if (editing && editing !== "new") await update(editing, d); else await create(d);
    setEditing(null);
  }

  const viewIncome = incomes.find((i) => i.id === viewing);
  return (
    <div className="space-y-6 p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary">{t("income")}</h1>
          <p className="text-xs text-muted-foreground">{t("incomeSubtitle")}</p>
        </div>
        <button type="button" onClick={() => setEditing("new")}
          className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 font-body font-bold">
          <Plus className="h-4 w-4" /> {t("newIncome")}
        </button>
      </div>
      {editing !== null && (
        <IncomeForm incomeCats={cats.filter((c) => c.kind === "income")}
          payCats={cats.filter((c) => c.kind === "payment_method")}
          initial={editRow} onSubmit={submit} onCancel={() => setEditing(null)} />
      )}
      <IncomeTable rows={incomes} onView={setViewing} onEdit={setEditing}
        onDelete={(id) => { if (window.confirm(`${t("delete")}?`)) void remove(id); }} />
      {viewIncome && <IncomeDetail income={viewIncome} onClose={() => setViewing(null)} />}
    </div>
  );
}
