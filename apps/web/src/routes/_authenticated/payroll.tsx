import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { supabase } from "@shared/lib/supabase";
import { useI18n } from "@shared/i18n";
import { usePayroll } from "@finance/application/usePayroll.hook";
import { supabasePayrollRepository } from "@finance/infrastructure/supabase-payroll.repository";
import { PayrollForm } from "@finance/presentation/PayrollForm";
import { PayrollTable } from "@finance/presentation/PayrollTable";
import { PayrollDetail } from "@finance/presentation/PayrollDetail";
import type { PayrollFormData } from "@finance/domain/payroll.types";

export const Route = createFileRoute("/_authenticated/payroll")({ component: PayrollPage });

type Emp = { id: string; full_name: string };
type Cat = { id: string; label: string; kind: string };

function PayrollPage() {
  const { t } = useI18n();
  const { items, create, update, remove, preview } = usePayroll(supabasePayrollRepository);
  const [emps, setEmps] = useState<Emp[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [viewing, setViewing] = useState<string | null>(null);

  useEffect(() => {
    void supabase.from("profiles").select("id, full_name")
      .then(({ data }) => setEmps((data as Emp[] | null) ?? []));
    void supabase.from("categories").select("id,label,kind").eq("kind", "payment_method")
      .then(({ data }) => setCats((data as Cat[] | null) ?? []));
  }, []);

  const editRow = useMemo<PayrollFormData | undefined>(() => {
    const i = items.find((x) => x.id === editing);
    return i ? { employeeId: i.employeeId, amount: i.amount, period: i.period,
      paymentMethodId: i.paymentMethodId, date: i.date, notes: i.notes, evidenceUrls: i.evidenceUrls,
      workerType: i.workerType, grossSalary: i.grossSalary || i.amount } : undefined;
  }, [editing, items]);

  async function submit(d: PayrollFormData) {
    if (editing && editing !== "new") await update(editing, d); else await create(d);
    setEditing(null);
  }

  const viewItem = items.find((i) => i.id === viewing);
  return (
    <div className="space-y-6 p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary">{t("payroll")}</h1>
          <p className="text-xs text-muted-foreground">{t("payrollSubtitle")}</p>
        </div>
        <button type="button" onClick={() => setEditing("new")}
          className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 font-body font-bold">
          <Plus className="h-4 w-4" /> {t("newPayroll")}
        </button>
      </div>
      {editing !== null && (
        <PayrollForm employees={emps} payCats={cats} preview={preview}
          initial={editRow} onSubmit={submit} onCancel={() => setEditing(null)} />
      )}
      <PayrollTable rows={items} onView={setViewing} onEdit={setEditing}
        onDelete={(id) => { if (window.confirm(`${t("delete")}?`)) void remove(id); }} />
      {viewItem && <PayrollDetail item={viewItem} onClose={() => setViewing(null)} />}
    </div>
  );
}
