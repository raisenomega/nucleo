import { useI18n } from "@shared/i18n";
import type { TranslationKey } from "@shared/i18n";
import type { EmployeeDetailUpdate } from "@admin/domain/employee-detail.types";

type SetFn = <K extends keyof EmployeeDetailUpdate>(k: K, v: EmployeeDetailUpdate[K]) => void;
type Opt = { v: string; l: string };
const EXAM: Opt[] = [{ v: "approved", l: "Aprobado" }, { v: "pending", l: "Pendiente" }, { v: "not_done", l: "No realizado" }];
const DRUG: Opt[] = [{ v: "negative", l: "Negativo" }, { v: "positive", l: "Positivo" }, { v: "pending", l: "Pendiente" }, { v: "not_done", l: "No realizado" }];
const BLOOD = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const EQUIP = ["casco", "guantes", "gafas", "botas", "chaleco"];

export function ProfileHealthTab({ form, set }: { form: EmployeeDetailUpdate; set: SetFn }) {
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
  const pe = (form.protective_equipment as string[] | null) ?? [];
  const toggle = (v: string) => set("protective_equipment", (pe.includes(v) ? pe.filter((x) => x !== v) : [...pe, v]) as never);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-card p-5 md:grid-cols-3">
        {sel("medical_exam_status", "medicalExam", EXAM)}{inp("medical_exam_date", "examDate", "date")}{inp("medical_exam_next", "nextExam", "date")}
        {sel("drug_test_status", "drugTest", DRUG)}{inp("drug_test_date", "testDate", "date")}
        {sel("blood_type", "bloodType", BLOOD.map((b) => ({ v: b, l: b })))}
        {inp("allergies", "allergies")}{inp("current_medications", "medications")}{inp("physical_limitations", "limitations")}
      </div>
      <label className="block space-y-1 rounded-lg border border-border bg-card p-5"><span className={lbl}>{t("medicalConditions")} · <span className="text-destructive">{t("confidential")}</span></span>
        <textarea rows={2} value={(form.medical_conditions as string | null) ?? ""} onChange={(e) => set("medical_conditions", e.target.value)} className={fld} /></label>
      <div className="space-y-3 rounded-lg border border-border bg-card p-5">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!form.uses_uniform} onChange={(e) => set("uses_uniform", e.target.checked as never)} /> {t("uniform")}</label>
          {inp("shirt_size", "shirtSize")}{inp("pants_size", "pantsSize")}{inp("shoe_size", "shoeSize")}
        </div>
        <div><span className={lbl}>{t("protectiveEquipment")}</span>
          <div className="mt-1 flex flex-wrap gap-3">{EQUIP.map((e) => <label key={e} className="flex items-center gap-1 text-sm capitalize"><input type="checkbox" checked={pe.includes(e)} onChange={() => toggle(e)} /> {e}</label>)}</div></div>
        {inp("assigned_equipment", "assignedEquipment")}
      </div>
    </div>
  );
}
