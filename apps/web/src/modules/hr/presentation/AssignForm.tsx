import { useState } from "react";
import { useI18n } from "@shared/i18n";
import type { Course, TrResult } from "@hr/domain/training.types";

type Emp = { id: string; full_name: string };

export function AssignForm({ employees, courses, onSubmit, onCancel }: {
  employees: Emp[]; courses: Course[]; onSubmit: (emp: string, course: string, due: string | null) => Promise<TrResult>; onCancel: () => void;
}) {
  const { t } = useI18n();
  const [emp, setEmp] = useState("");
  const [course, setCourse] = useState("");
  const [due, setDue] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit() {
    if (!emp || !course) return;
    setBusy(true);
    const r = await onSubmit(emp, course, due || null);
    setBusy(false);
    if (!r.ok) window.alert(r.error); else onCancel();
  }
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  return (
    <form onSubmit={(e) => { e.preventDefault(); void submit(); }} className="space-y-3 rounded-lg border border-border bg-card p-5">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <select required value={emp} onChange={(e) => setEmp(e.target.value)} className={fld}><option value="">{t("employee")}</option>{employees.map((x) => <option key={x.id} value={x.id}>{x.full_name}</option>)}</select>
        <select required value={course} onChange={(e) => setCourse(e.target.value)} className={fld}><option value="">{t("course")}</option>{courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select>
        <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className={fld} />
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={busy} className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold disabled:opacity-50">{t("save")}</button>
        <button type="button" onClick={onCancel} className="rounded-lg bg-secondary px-4 py-2 text-sm">{t("cancel")}</button>
      </div>
    </form>
  );
}
