import { useI18n } from "@shared/i18n";
import type { TranslationKey } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import type { EmployeeDetailUpdate } from "@admin/domain/employee-detail.types";
import { BenefitPlansSection } from "@admin/presentation/BenefitPlansSection";

type SetFn = <K extends keyof EmployeeDetailUpdate>(k: K, v: EmployeeDetailUpdate[K]) => void;
const N = (v: unknown) => Number(v ?? 0);
const PERIODS: Record<string, number> = { weekly: 52, biweekly: 26, monthly: 12 };

export function ProfileBenefitsTab({ form, set }: { form: EmployeeDetailUpdate; set: SetFn }) {
  const { t } = useI18n();
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  const lbl = "text-xs font-bold text-muted-foreground";
  const num = (k: keyof EmployeeDetailUpdate, label: TranslationKey) => (
    <label className="space-y-1"><span className={lbl}>{t(label)}</span>
      <input type="number" value={(form[k] as number | null) ?? ""} onChange={(e) => set(k, Number(e.target.value) as never)} className={fld} /></label>
  );
  const info = (label: string, v: string) => (<div><div className={lbl}>{label}</div><div className="text-sm font-bold text-primary">{v}</div></div>);
  const months = form.hire_date ? Math.max(0, Math.round((Date.now() - new Date(form.hire_date).getTime()) / 2.628e9)) : 0;
  const vacAcc = months * N(form.vacation_rate), sickAcc = months * N(form.sick_rate);
  const annual = N(form.gross_salary) * (PERIODS[form.pay_frequency ?? ""] ?? 0);
  const bonusEst = annual * N(form.bonus_pct) / 100;
  const card = "grid grid-cols-2 gap-3 rounded-lg border border-border bg-card p-5 md:grid-cols-5";
  return (
    <div className="space-y-4">
      <div className={card}>
        {num("vacation_rate", "vacationRate")}{info(t("accrued"), vacAcc.toFixed(1))}{num("vacation_used", "used")}
        {info(t("available"), (vacAcc - N(form.vacation_used)).toFixed(1))}{num("vacation_max", "maxAccrual")}
      </div>
      <div className={card}>
        {num("sick_rate", "sickRate")}{info(t("accrued"), sickAcc.toFixed(1))}{num("sick_used", "used")}
        {info(t("available"), (sickAcc - N(form.sick_used)).toFixed(1))}{num("sick_max", "maxAccrual")}
      </div>
      <div className={card}>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!form.bonus_applies} onChange={(e) => set("bonus_applies", e.target.checked as never)} /> {t("bonus")}</label>
        {num("bonus_pct", "bonusPct")}{info(t("estimated"), formatCurrency(bonusEst))}{num("bonus_paid", "paid")}
        {info(t("pending"), formatCurrency(bonusEst - N(form.bonus_paid)))}
      </div>
      <BenefitPlansSection form={form} set={set} />
    </div>
  );
}
