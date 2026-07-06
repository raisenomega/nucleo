import { useEffect, useState } from "react";
import { useI18n } from "@shared/i18n";
import { useSession } from "@shared/providers/SessionProvider";
import { EvidenceUpload } from "@finance/presentation/EvidenceUpload";
import { PayrollDeductionPreview } from "@finance/presentation/PayrollDeductionPreview";
import type { PayrollFormData, PayrollCalc, WorkerType } from "@finance/domain/payroll.types";

type Emp = { id: string; full_name: string };
type Cat = { id: string; label: string };
const PERIODS = ["Semana", "Quincena", "Mensual"];
const EMPTY: PayrollFormData = { employeeId: "", amount: 0, period: "", paymentMethodId: "", date: "", notes: "", evidenceUrls: [], workerType: "employee", grossSalary: 0 };

export function PayrollForm({ employees, payCats, initial, preview, onSubmit, onCancel }: {
  employees: Emp[]; payCats: Cat[]; initial?: PayrollFormData;
  preview: (gross: number, worker: WorkerType) => Promise<PayrollCalc | null>;
  onSubmit: (d: PayrollFormData) => void; onCancel: () => void;
}) {
  const { t } = useI18n();
  const { session } = useSession();
  const [f, setF] = useState<PayrollFormData>(initial ?? EMPTY);
  const [calc, setCalc] = useState<PayrollCalc | null>(null);
  const worker = f.workerType ?? "employee";
  const gross = f.grossSalary ?? f.amount;
  useEffect(() => { if (gross > 0) void preview(gross, worker).then(setCalc); else setCalc(null); }, [gross, worker, preview]);
  const field = "w-full rounded-lg border border-border bg-background p-2 font-body";
  const lbl = "text-xs font-bold text-muted-foreground";
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(f); }} className="space-y-4 rounded-lg border border-border bg-card p-5">
      <h2 className="font-body font-bold">{t("newPayroll")}</h2>
      <div className="flex gap-4 text-sm">
        {(["employee", "contractor"] as WorkerType[]).map((w) => (
          <label key={w} className="flex items-center gap-1"><input type="radio" checked={worker === w} onChange={() => setF({ ...f, workerType: w })} /> {t(w)}</label>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <label className="space-y-1"><span className={lbl}>{t("employee")}</span>
          <select value={f.employeeId} onChange={(e) => setF({ ...f, employeeId: e.target.value })} className={field}>
            <option value="">—</option>{employees.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
          </select></label>
        <label className="space-y-1"><span className={lbl}>{worker === "employee" ? t("grossSalary") : t("amount")}</span>
          <input type="number" step="0.01" min="0" value={gross || ""} onChange={(e) => setF({ ...f, grossSalary: Number(e.target.value), amount: Number(e.target.value) })} className={field} /></label>
        <label className="space-y-1"><span className={lbl}>{t("period")}</span>
          <select value={f.period} onChange={(e) => setF({ ...f, period: e.target.value })} className={field}>
            <option value="">—</option>{PERIODS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select></label>
        <label className="space-y-1"><span className={lbl}>{t("paymentMethod")}</span>
          <select value={f.paymentMethodId} onChange={(e) => setF({ ...f, paymentMethodId: e.target.value })} className={field}>
            <option value="">—</option>{payCats.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select></label>
        <label className="space-y-1"><span className={lbl}>{t("date")}</span>
          <input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} className={field} /></label>
        <label className="space-y-1 md:col-span-3"><span className={lbl}>{t("notes")}</span>
          <input value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} className={field} /></label>
      </div>
      {calc && <PayrollDeductionPreview calc={calc} workerType={worker} />}
      <EvidenceUpload tenantId={session?.tenantId ?? ""} value={f.evidenceUrls ?? []} onChange={(paths) => setF({ ...f, evidenceUrls: paths })} />
      <div className="flex gap-2">
        <button type="submit" className="rounded-lg bg-primary text-primary-foreground px-4 py-2 font-body font-bold">{t("save")}</button>
        <button type="button" onClick={onCancel} className="rounded-lg bg-secondary text-foreground px-4 py-2 font-body">{t("cancel")}</button>
      </div>
    </form>
  );
}
