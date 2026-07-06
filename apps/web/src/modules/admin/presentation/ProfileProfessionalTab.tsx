import { useI18n } from "@shared/i18n";
import type { TranslationKey } from "@shared/i18n";
import type { EmployeeDetailUpdate } from "@admin/domain/employee-detail.types";

type SetFn = <K extends keyof EmployeeDetailUpdate>(k: K, v: EmployeeDetailUpdate[K]) => void;
type Opt = { v: string; l: string };
const DEPT: Opt[] = [{ v: "operaciones", l: "Operaciones" }, { v: "finanzas", l: "Finanzas" }, { v: "ventas", l: "Ventas" }, { v: "admin", l: "Admin" }];
const CONTRACT: Opt[] = [{ v: "indefinite", l: "Indefinido" }, { v: "probationary", l: "Probatorio" }, { v: "temporary", l: "Temporal" }, { v: "contractor", l: "Contratista" }];
const FLSA: Opt[] = [{ v: "exempt", l: "Exento" }, { v: "non_exempt", l: "No exento" }];
const FREQ: Opt[] = [{ v: "weekly", l: "Semanal" }, { v: "biweekly", l: "Quincenal" }, { v: "monthly", l: "Mensual" }];
const RISK: Opt[] = [{ v: "low", l: "Bajo" }, { v: "medium", l: "Medio" }, { v: "high", l: "Alto" }];

export function ProfileProfessionalTab({ form, set }: { form: EmployeeDetailUpdate; set: SetFn }) {
  const { t } = useI18n();
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  const lbl = "text-xs font-bold text-muted-foreground";
  const inp = (k: keyof EmployeeDetailUpdate, label: TranslationKey, type = "text") => (
    <label className="space-y-1"><span className={lbl}>{t(label)}</span>
      <input type={type} value={(form[k] as string | null) ?? ""} onChange={(e) => set(k, e.target.value as never)} className={fld} /></label>
  );
  const sel = (k: keyof EmployeeDetailUpdate, label: TranslationKey, opts: Opt[]) => (
    <label className="space-y-1"><span className={lbl}>{t(label)}</span>
      <select value={(form[k] as string | null) ?? ""} onChange={(e) => set(k, e.target.value as never)} className={fld}>
        <option value="">—</option>{opts.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}</select></label>
  );
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h3 className="mb-3 font-body font-bold text-primary">{t("professionalInfo")}</h3>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {sel("department", "department", DEPT)}{inp("employee_number", "employeeNumber")}
        {inp("hire_date", "hireDate", "date")}{inp("termination_date", "terminationDate", "date")}{inp("probation_end_date", "probationEnd", "date")}
        {sel("contract_type", "contractType", CONTRACT)}{sel("flsa_classification", "flsaClass", FLSA)}{sel("risk_classification", "riskClass", RISK)}
        {inp("gross_salary", "grossSalary", "number")}{sel("pay_frequency", "payFrequency", FREQ)}
      </div>
      <label className="mt-3 block space-y-1"><span className={lbl}>{t("professionalNotes")}</span>
        <textarea rows={2} value={(form.professional_notes as string | null) ?? ""} onChange={(e) => set("professional_notes", e.target.value)} className={fld} /></label>
    </div>
  );
}
