import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@shared/lib/supabase";
import { useI18n } from "@shared/i18n";
import { useIncome } from "@finance/application/useIncome.hook";
import { supabaseIncomeRepository } from "@finance/infrastructure/supabase-income.repository";
import { IncomeForm } from "@finance/presentation/IncomeForm";
import type { IncomeFormData } from "@finance/domain/income.types";

export const Route = createFileRoute("/_authenticated/income")({ component: IncomePage });

type Cat = { id: string; label: string; kind: string };

function IncomePage() {
  const { t } = useI18n();
  const { incomes, create, update, remove } = useIncome(supabaseIncomeRepository);
  const [cats, setCats] = useState<Cat[]>([]);
  const [editing, setEditing] = useState<string | null>(null); // id | "new" | null

  useEffect(() => {
    void supabase.from("categories").select("id,label,kind")
      .in("kind", ["income", "payment_method"])
      .then(({ data }) => setCats((data as Cat[] | null) ?? []));
  }, []);

  const editRow = useMemo<IncomeFormData | undefined>(() => {
    const i = incomes.find((x) => x.id === editing);
    return i ? { categoryId: i.categoryId, amount: i.amount, description: i.description,
      date: i.date, paymentMethodId: i.paymentMethodId } : undefined;
  }, [editing, incomes]);

  async function submit(d: IncomeFormData) {
    if (editing && editing !== "new") await update(editing, d);
    else await create(d);
    setEditing(null);
  }

  return (
    <main className="min-h-screen bg-background text-foreground p-8">
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl font-bold text-primary">{t("incomeList")}</h1>
          <button type="button" onClick={() => setEditing("new")}
            className="rounded-lg bg-primary text-primary-foreground px-4 py-2 font-body font-bold">{t("newIncome")}</button>
        </div>
        {editing !== null && (
          <IncomeForm incomeCats={cats.filter((c) => c.kind === "income")}
            payCats={cats.filter((c) => c.kind === "payment_method")}
            initial={editRow} onSubmit={submit} onCancel={() => setEditing(null)} />
        )}
        {incomes.length === 0 ? (
          <p className="font-body text-muted-foreground">{t("noRecords")}</p>
        ) : (
          <table className="w-full font-body text-sm">
            <thead><tr className="text-left text-muted-foreground">
              <th className="py-2">{t("date")}</th><th>{t("category")}</th><th>{t("amount")}</th><th>{t("paymentMethod")}</th><th>{t("actions")}</th>
            </tr></thead>
            <tbody>
              {incomes.map((i) => (
                <tr key={i.id} className="border-t border-secondary">
                  <td className="py-2">{i.date}</td><td>{i.categoryLabel}</td><td>{i.amount}</td><td>{i.paymentMethodLabel}</td>
                  <td className="flex gap-3 py-2">
                    <button type="button" onClick={() => setEditing(i.id)} className="text-primary">{t("edit")}</button>
                    <button type="button" onClick={() => { if (window.confirm(`${t("delete")}?`)) void remove(i.id); }}
                      className="text-destructive">{t("delete")}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
