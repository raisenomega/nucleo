import { useState } from "react";
import { useI18n, type TranslationKey } from "@shared/i18n";
import type { MyDetails, MyDetailsEdit, PortalResult } from "@hr/domain/portal.types";

// Editable: dirección + teléfono personal + contacto de emergencia. Read-only: nombre/email/puesto (los cambia RRHH).
const FIELDS: { k: keyof MyDetailsEdit; label: TranslationKey }[] = [
  { k: "addressLine1", label: "address" }, { k: "city", label: "city" }, { k: "stateProvince", label: "stateProvince" },
  { k: "zipCode", label: "zipCode" }, { k: "personalPhone", label: "phone" },
  { k: "emergencyName", label: "emergencyContact" }, { k: "emergencyPhone", label: "phone" },
];

export function MyProfile({ details, onSave }: { details: MyDetails; onSave: (e: MyDetailsEdit) => Promise<PortalResult> }) {
  const { t } = useI18n();
  const [form, setForm] = useState<MyDetailsEdit>({ ...details });
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState("");
  async function save() { setBusy(true); const r = await onSave(form); setBusy(false); setMsg(r.ok ? t("saved") : (r as { error: string }).error); }
  const ro = (label: TranslationKey, v: string | null) => (
    <div><span className="text-xs font-bold text-muted-foreground">{t(label)}</span><p className="text-sm text-foreground">{v || "—"}</p></div>);
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-4 rounded-xl border border-border bg-card p-4 md:grid-cols-3">
        {ro("name", details.fullName)}{ro("email", details.email)}{ro("jobInfo", details.position)}
        {ro("department", details.department)}{ro("hireDate", details.hireDate)}{ro("phone", details.phone)}
      </section>
      <section className="space-y-3">
        <h3 className="font-body text-sm font-bold text-foreground">{t("personalInfo")}</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {FIELDS.map(({ k, label }) => (
            <label key={k} className="space-y-1"><span className="text-xs font-bold text-muted-foreground">{t(label)}</span>
              <input value={(form[k] as string) ?? ""} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className={fld} /></label>))}
        </div>
        <div className="flex items-center gap-3">
          <button type="button" disabled={busy} onClick={() => void save()} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">{t("saveChanges")}</button>
          {msg && <span className="text-sm text-muted-foreground">{msg}</span>}
        </div>
      </section>
    </div>
  );
}
