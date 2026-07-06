import { useI18n } from "@shared/i18n";
import type { TranslationKey } from "@shared/i18n";
import type { EmployeeDetailUpdate } from "@admin/domain/employee-detail.types";

type SetFn = <K extends keyof EmployeeDetailUpdate>(k: K, v: EmployeeDetailUpdate[K]) => void;

export function BenefitPlansSection({ form, set }: { form: EmployeeDetailUpdate; set: SetFn }) {
  const { t } = useI18n();
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  const lbl = "text-xs font-bold text-muted-foreground";
  const txt = (k: keyof EmployeeDetailUpdate, label: TranslationKey, type = "text") => (
    <label className="space-y-1"><span className={lbl}>{t(label)}</span>
      <input type={type} value={(form[k] as string | number | null) ?? ""} onChange={(e) => set(k, (type === "number" ? Number(e.target.value) : e.target.value) as never)} className={fld} /></label>
  );
  const chk = (k: keyof EmployeeDetailUpdate, label: TranslationKey) => (
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!form[k]} onChange={(e) => set(k, e.target.checked as never)} /> {t(label)}</label>
  );
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="space-y-3 rounded-lg border border-border bg-card p-5">
        {chk("medical_plan", "medicalPlan")}
        <div className="grid grid-cols-2 gap-3">
          {txt("medical_provider", "provider")}{txt("medical_policy_number", "policyNumber")}
          {txt("medical_employee_contribution", "employeeContribution", "number")}{txt("medical_employer_contribution", "employerContribution", "number")}
        </div>
      </div>
      <div className="space-y-3 rounded-lg border border-border bg-card p-5">
        {chk("retirement_plan", "retirementPlan")}
        <div className="grid grid-cols-2 gap-3">
          {txt("retirement_type", "planType")}{txt("retirement_provider", "provider")}
          {txt("retirement_employee_pct", "employeeContribution", "number")}{txt("retirement_employer_match_pct", "employerMatchPct", "number")}
        </div>
      </div>
      <div className="flex flex-wrap gap-4 rounded-lg border border-border bg-card p-5 md:col-span-2">
        {chk("life_insurance", "lifeInsurance")}{chk("parking", "parking")}{chk("company_vehicle", "companyVehicle")}{chk("company_phone", "companyPhone")}
        <label className="flex-1 space-y-1"><span className={lbl}>{t("otherBenefits")}</span>
          <input value={(form.other_benefits as string | null) ?? ""} onChange={(e) => set("other_benefits", e.target.value)} className={fld} /></label>
      </div>
    </div>
  );
}
