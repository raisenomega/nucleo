import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Plus, Users } from "lucide-react";
import { supabase } from "@shared/lib/supabase";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { usePayroll } from "@finance/application/usePayroll.hook";
import { useExternalWorkers } from "@finance/application/useExternalWorkers.hook";
import { supabasePayrollRepository } from "@finance/infrastructure/supabase-payroll.repository";
import { supabaseExternalWorkerRepository } from "@finance/infrastructure/supabase-external-workers.repository";
import { FinanceReportButton } from "@finance/presentation/FinanceReportButton";
import { payrollReportBody } from "@finance/presentation/finance-reports";
import { PayrollForm } from "@finance/presentation/PayrollForm";
import { PayrollTable } from "@finance/presentation/PayrollTable";
import { PayrollDetail } from "@finance/presentation/PayrollDetail";
import { ExternalWorkersModal } from "@finance/presentation/ExternalWorkersModal";
import type { PayrollFormData } from "@finance/domain/payroll.types";
import type { ExternalWorker } from "@finance/domain/external-worker.types";

export const Route = createFileRoute("/_authenticated/payroll")({ component: PayrollPage });

type Emp = { id: string; full_name: string };
type Cat = { id: string; label: string; kind: string };

function PayrollPage() {
  const { t } = useI18n();
  const { can } = useModuleAccess();
  const { items, create, update, remove, preview } = usePayroll(supabasePayrollRepository);
  const workers = useExternalWorkers(supabaseExternalWorkerRepository);
  const [emps, setEmps] = useState<Emp[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [viewing, setViewing] = useState<string | null>(null);
  const [managing, setManaging] = useState(false);
  const [prefill, setPrefill] = useState<PayrollFormData | undefined>();
  const externals = useMemo(() => workers.items.filter((w) => w.active).map((w) => ({ id: w.id, full_name: w.fullName, workerType: w.workerType, dailyRate: w.dailyRate, hourlyRate: w.hourlyRate, specialty: w.specialty, department: w.department })), [workers.items]);

  useEffect(() => {
    void supabase.from("profiles").select("id, full_name").then(({ data }) => setEmps((data as Emp[] | null) ?? []));
    void supabase.from("categories").select("id,label,kind").eq("kind", "payment_method").then(({ data }) => setCats((data as Cat[] | null) ?? []));
  }, []);

  const editRow = useMemo<PayrollFormData | undefined>(() => { const i = items.find((x) => x.id === editing); return i ? { employeeId: i.employeeId, externalWorkerId: i.externalWorkerId, amount: i.amount, period: i.period, paymentMethodId: i.paymentMethodId, date: i.date, notes: i.notes, evidenceUrls: i.evidenceUrls, workerType: i.workerType, grossSalary: i.grossSalary || i.amount } : undefined; }, [editing, items]);
  const onWorkerCreated = (w: ExternalWorker) => { const s = w.dailyRate ?? w.hourlyRate ?? 0; setPrefill({ employeeId: "", externalWorkerId: w.id, amount: s, period: "", paymentMethodId: "", date: "", notes: "", evidenceUrls: [], workerType: w.workerType, grossSalary: s }); setManaging(false); setEditing("new"); void workers.refresh(); };

  async function submit(d: PayrollFormData) {
    if (editing && editing !== "new") await update(editing, d); else await create(d);
    setEditing(null);
  }

  if (!can("payroll", "view")) return <Navigate to="/dashboard" />;
  const viewItem = items.find((i) => i.id === viewing);
  const onEdit = can("payroll", "edit") ? setEditing : undefined;
  const onDelete = can("payroll", "delete") ? (id: string) => { if (window.confirm(`${t("delete")}?`)) void remove(id); } : undefined;
  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-display text-xl font-bold text-foreground md:text-3xl">{t("payroll")}</h1>
          <div className="flex items-center gap-2">
            {can("payroll", "salary") && <FinanceReportButton title={t("payroll")} makeBody={(f, to) => payrollReportBody(items, f, to)} />}
            {can("payroll", "view") && <button type="button" onClick={() => setManaging(true)} className="flex items-center gap-2 rounded-lg bg-secondary text-foreground px-3 py-2 text-sm font-body font-bold"><Users className="h-4 w-4" /> {t("externalWorkers")}</button>}
            {can("payroll", "create") && <button type="button" onClick={() => { setPrefill(undefined); setEditing("new"); }} className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm font-body font-bold"><Plus className="h-4 w-4" /> {t("newPayroll")}</button>}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{t("payrollSubtitle")}</p>
      </div>
      {editing !== null && <PayrollForm employees={emps} externals={externals} payCats={cats} preview={preview} initial={editing === "new" ? prefill : editRow} onSubmit={submit} onCancel={() => setEditing(null)} />}
      <PayrollTable rows={items.filter((i) => !i.externalWorkerId)} onView={setViewing} onEdit={onEdit} onDelete={onDelete} />
      <PayrollTable title="externalPayments" icon={<Users className="h-4 w-4" />} rows={items.filter((i) => i.externalWorkerId)} onView={setViewing} onEdit={onEdit} onDelete={onDelete} />
      {viewItem && <PayrollDetail item={viewItem} onClose={() => setViewing(null)} />}
      {managing && <ExternalWorkersModal onClose={() => { setManaging(false); void workers.refresh(); }} onWorkerCreated={onWorkerCreated} />}
    </div>
  );
}
