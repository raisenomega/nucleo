import { useState } from "react";
import { useI18n } from "@shared/i18n";
import { CATEGORIES, CAT_KEY } from "@hr/presentation/obs-ui";
import type { ObsCategory, ObsResult } from "@hr/domain/observation.types";

type Emp = { id: string; full_name: string };
const NEEDS_FOLLOW = (c: ObsCategory) => c === "INCIDENTE" || c === "OPORTUNIDAD_MEJORA";

export function ObservationForm({ employees, onSubmit, onCancel }: {
  employees: Emp[]; onSubmit: (e: string, c: ObsCategory, n: string, f: string | null) => Promise<ObsResult>; onCancel: () => void;
}) {
  const { t } = useI18n();
  const [emp, setEmp] = useState("");
  const [cat, setCat] = useState<ObsCategory>("LOGRO");
  const [notes, setNotes] = useState("");
  const [follow, setFollow] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit() {
    if (!emp || !notes.trim()) return;
    setBusy(true);
    const r = await onSubmit(emp, cat, notes.trim(), NEEDS_FOLLOW(cat) ? (follow || null) : null);
    setBusy(false);
    if (!r.ok) window.alert(r.error); else onCancel();
  }
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  return (
    <form onSubmit={(e) => { e.preventDefault(); void submit(); }} className="space-y-3 rounded-lg border border-border bg-card p-5">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <select required value={emp} onChange={(e) => setEmp(e.target.value)} className={fld}>
          <option value="">{t("employee")}</option>{employees.map((x) => <option key={x.id} value={x.id}>{x.full_name}</option>)}</select>
        <select value={cat} onChange={(e) => setCat(e.target.value as ObsCategory)} className={fld}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{t(CAT_KEY[c])}</option>)}</select>
      </div>
      <textarea required value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("notes")} rows={3} className={fld} />
      {NEEDS_FOLLOW(cat) && (
        <label className="block space-y-1"><span className="text-xs font-bold text-muted-foreground">{t("followUp")}</span>
          <input type="date" value={follow} onChange={(e) => setFollow(e.target.value)} className={fld} /></label>)}
      <div className="flex gap-2">
        <button type="submit" disabled={busy} className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold disabled:opacity-50">{t("save")}</button>
        <button type="button" onClick={onCancel} className="rounded-lg bg-secondary px-4 py-2 text-sm">{t("cancel")}</button>
      </div>
    </form>
  );
}
