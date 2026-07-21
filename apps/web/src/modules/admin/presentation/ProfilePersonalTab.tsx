import { useI18n } from "@shared/i18n";
import type { TranslationKey } from "@shared/i18n";
import type { EmployeeDetailUpdate } from "@admin/domain/employee-detail.types";
import { SsnField } from "@admin/presentation/SsnField";

type SetFn = <K extends keyof EmployeeDetailUpdate>(k: K, v: EmployeeDetailUpdate[K]) => void;
type Opt = { v: string; l: string };
const GENDER: Opt[] = [{ v: "male", l: "Masculino" }, { v: "female", l: "Femenino" }, { v: "unspecified", l: "No especifica" }];
const MARITAL: Opt[] = [{ v: "single", l: "Soltero" }, { v: "married", l: "Casado" }, { v: "divorced", l: "Divorciado" }, { v: "widowed", l: "Viudo" }];
const RELATION: Opt[] = [{ v: "spouse", l: "Esposo/a" }, { v: "parent", l: "Padre/Madre" }, { v: "child", l: "Hijo/a" }, { v: "sibling", l: "Hermano/a" }, { v: "other", l: "Otro" }];

export function ProfilePersonalTab({ form, set, profileId }: { form: EmployeeDetailUpdate; set: SetFn; profileId: string }) {
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
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="mb-3 font-body font-bold text-foreground">{t("personalInfo")}</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {inp("middle_name", "middleName")}{inp("last_name", "lastName")}<SsnField profileId={profileId} label={t("ssn")} />
          {inp("date_of_birth", "dateOfBirth", "date")}{sel("gender", "gender", GENDER)}{sel("marital_status", "maritalStatus", MARITAL)}
          {inp("dependents", "dependents", "number")}{inp("personal_phone", "phone")}{inp("alternate_phone", "alternatePhone")}
          {inp("personal_email", "personalEmail")}{inp("address_line1", "addressLine1")}{inp("address_line2", "addressLine2")}
          {inp("city", "city")}{inp("state_province", "stateProvince")}{inp("zip_code", "zip")}{inp("country", "country")}
        </div>
      </div>
      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="mb-3 font-body font-bold text-foreground">{t("emergencyContact")}</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {inp("emergency_name", "contactName")}{sel("emergency_relationship", "relationship", RELATION)}{inp("emergency_phone", "phone")}
          {inp("emergency_phone_alt", "alternatePhone")}{inp("emergency_address", "address")}
        </div>
      </div>
    </div>
  );
}
