import { useEffect, useState } from "react";
import { useI18n } from "@shared/i18n";
import type { TranslationKey } from "@shared/i18n";
import { useSession } from "@shared/providers/SessionProvider";
import { EvidenceUpload } from "@finance/presentation/EvidenceUpload";
import { PayrollDeductionPreview } from "@finance/presentation/PayrollDeductionPreview";
import { CategoryPicker } from "@shared/components/CategoryPicker";
import type { PayrollFormData, PayrollCalc, WorkerType } from "@finance/domain/payroll.types";

type Emp = { id: string; full_name: string };
type Cat = { id: string; label: string };
const PERIODS = ["Semana", "Quincena", "Mensual", "Pago único"];
const WORKERS: [WorkerType, TranslationKey][] = [["employee", "employee"], ["contractor", "contractor"], ["helper", "workerHelper"], ["speaker", "workerSpeaker"], ["consultant", "workerConsultant"], ["technician", "workerTechnician"], ["freelancer", "workerFreelancer"]];
const ONE_TIME_DEFAULT = new Set<WorkerType>(["helper", "speaker", "consultant", "technician", "freelancer"]);
const EMPTY: PayrollFormData = { employeeId: "", externalWorkerId: "", amount: 0, period: "", paymentMethodId: "", date: "", notes: "", evidenceUrls: [], workerType: "employee", grossSalary: 0 };
type Ext = { id: string; full_name: string; workerType: WorkerType; dailyRate: number | null; hourlyRate: number | null; specialty: string; department: string };

export function PayrollForm({ employees, externals, payCats, initial, preview, onSubmit, onCancel }: {
  employees: Emp[]; externals: Ext[]; payCats: Cat[]; initial?: PayrollFormData;
  preview: (gross: number, worker: WorkerType) => Promise<PayrollCalc | null>;
  onSubmit: (d: PayrollFormData) => void; onCancel: () => void;
}) {
  const { t } = useI18n();
  const { session } = useSession();
  const [f, setF] = useState<PayrollFormData>(initial ?? EMPTY);
  const [calc, setCalc] = useState<PayrollCalc | null>(null);
  const worker = f.workerType ?? "employee";
  const gross = f.grossSalary ?? f.amount;
  const setWorker = (w: WorkerType) => setF((c) => ({ ...c, workerType: w, ...(ONE_TIME_DEFAULT.has(w) && !c.period ? { period: "Pago único" } : {}) }));
  const pickBeneficiary = (v: string) => {
    if (v.startsWith("ext:")) { const w = externals.find((x) => x.id === v.slice(4)); const s = w?.dailyRate ?? w?.hourlyRate ?? 0; setF((c) => ({ ...c, employeeId: "", externalWorkerId: v.slice(4), workerType: w?.workerType ?? c.workerType, ...(s ? { grossSalary: s, amount: s } : {}) })); }
    else setF((c) => ({ ...c, employeeId: v.slice(4), externalWorkerId: "" }));
  };
  const selExt = externals.find((x) => x.id === f.externalWorkerId);
  useEffect(() => { if (gross > 0) void preview(gross, worker).then(setCalc); else setCalc(null); }, [gross, worker, preview]);
  const field = "w-full rounded-lg border border-border bg-background p-2 font-body";
  const lbl = "text-xs font-bold text-muted-foreground";
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(f); }} className="space-y-4 rounded-lg border border-border bg-card p-5">
      <h2 className="font-body font-bold">{t("newPayroll")}</h2>
      <label className="block max-w-xs space-y-1"><span className={lbl}>{t("workerTypeLabel")}</span>
        <select value={worker} onChange={(e) => setWorker(e.target.value as WorkerType)} className={field}>
          {WORKERS.map(([v, k]) => <option key={v} value={v}>{t(k)}</option>)}
        </select></label>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <label className="space-y-1"><span className={lbl}>{t("beneficiary")}</span>
          <select value={f.externalWorkerId ? `ext:${f.externalWorkerId}` : f.employeeId ? `emp:${f.employeeId}` : ""} onChange={(e) => pickBeneficiary(e.target.value)} className={field}>
            <option value="">—</option>
            <optgroup label={t("internalStaff")}>{employees.map((c) => <option key={c.id} value={`emp:${c.id}`}>{c.full_name}</option>)}</optgroup>
            <optgroup label={t("externalWorkers")}>{externals.map((c) => <option key={c.id} value={`ext:${c.id}`}>{c.full_name}</option>)}</optgroup>
          </select>
          {selExt && (selExt.specialty || selExt.department) && <span className="text-xs text-muted-foreground">{[selExt.specialty, selExt.department].filter(Boolean).join(" · ")}</span>}</label>
        <label className="space-y-1"><span className={lbl}>{worker === "employee" ? t("grossSalary") : t("amount")}</span>
          <input type="number" step="0.01" min="0" value={gross || ""} onChange={(e) => setF({ ...f, grossSalary: Number(e.target.value), amount: Number(e.target.value) })} className={field} /></label>
        <label className="space-y-1"><span className={lbl}>{t("period")}</span>
          <select value={f.period} onChange={(e) => setF({ ...f, period: e.target.value })} className={field}>
            <option value="">—</option>{PERIODS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select></label>
        <CategoryPicker kind="payment_method" value={f.paymentMethodId} onChange={(id) => setF({ ...f, paymentMethodId: id })} label="paymentMethod" />
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
