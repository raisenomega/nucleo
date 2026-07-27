import { useState } from "react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import { ListEditor } from "@hr/presentation/ListEditor";
import { EMP_KEY, SALARY_KEY } from "@hr/presentation/recruit-ui";
import type { PositionFormData, JobPosition, EmploymentType, SalaryType, RecruitResult } from "@hr/domain/recruitment.types";

const EMPTY: PositionFormData = { title: "", department: "", description: "", responsibilities: "", employmentType: "full_time",
  schedule: "", location: "", isRemote: false, salaryType: "hourly", salaryMin: null, salaryMax: null, positionsCount: 1,
  requirements: [], requiredDocuments: [], skills: [], minExperienceMonths: 0, educationLevel: "" };
const toForm = (p: JobPosition): PositionFormData => ({ ...EMPTY, title: p.title, department: p.department ?? "",
  description: p.description ?? "", responsibilities: p.responsibilities ?? "", employmentType: p.employmentType,
  schedule: p.schedule ?? "", location: p.location ?? "", isRemote: p.isRemote, salaryType: p.salaryType,
  salaryMin: p.salaryMin, salaryMax: p.salaryMax, positionsCount: p.positionsCount, requirements: [...p.requirements],
  requiredDocuments: [...p.requiredDocuments], skills: [...p.skills] });
const EMP: EmploymentType[] = ["full_time", "part_time", "contract", "temporary", "intern"];
const SAL: SalaryType[] = ["hourly", "salary", "commission", "mixed"];

export function PositionFormModal({ initial, onSubmit, onClose }: {
  initial?: JobPosition; onSubmit: (d: PositionFormData) => Promise<RecruitResult>; onClose: () => void;
}) {
  const { t } = useI18n();
  const [f, setF] = useState<PositionFormData>(initial ? toForm(initial) : EMPTY);
  const [err, setErr] = useState("");
  const set = <K extends keyof PositionFormData>(k: K, v: PositionFormData[K]) => setF((p) => ({ ...p, [k]: v }));
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  async function save() {
    if (!f.title.trim()) { setErr(t("requiredFields")); return; }
    const r = await onSubmit({ ...f, requirements: f.requirements.filter(Boolean), requiredDocuments: f.requiredDocuments.filter(Boolean), skills: f.skills.filter(Boolean) });
    if (r.ok) onClose(); else setErr(r.error);
  }
  return (
    <ScreenModal onClose={onClose}>
      <div className="space-y-3 p-4 md:p-6">
        <h2 className="font-display text-lg font-bold text-foreground">{initial ? t("editPosition") : t("createPosition")}</h2>
        <input value={f.title} onChange={(e) => set("title", e.target.value)} placeholder={t("jobTitle")} className={fld} />
        <div className="grid grid-cols-2 gap-2">
          <input value={f.department} onChange={(e) => set("department", e.target.value)} placeholder={t("department")} className={fld} />
          <select value={f.employmentType} onChange={(e) => set("employmentType", e.target.value as EmploymentType)} className={fld}>{EMP.map((x) => <option key={x} value={x}>{t(EMP_KEY[x])}</option>)}</select>
          <select value={f.salaryType} onChange={(e) => set("salaryType", e.target.value as SalaryType)} className={fld}>{SAL.map((x) => <option key={x} value={x}>{t(SALARY_KEY[x])}</option>)}</select>
          <input type="number" value={f.positionsCount || ""} onChange={(e) => set("positionsCount", Number(e.target.value))} placeholder={t("positionsCount")} className={fld} />
          <input type="number" value={f.salaryMin ?? ""} onChange={(e) => set("salaryMin", e.target.value ? Number(e.target.value) : null)} placeholder={t("salaryMin")} className={fld} />
          <input type="number" value={f.salaryMax ?? ""} onChange={(e) => set("salaryMax", e.target.value ? Number(e.target.value) : null)} placeholder={t("salaryMax")} className={fld} />
          <input value={f.schedule} onChange={(e) => set("schedule", e.target.value)} placeholder={t("schedule")} className={fld} />
          <input value={f.location} onChange={(e) => set("location", e.target.value)} placeholder={t("location")} className={fld} />
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.isRemote} onChange={(e) => set("isRemote", e.target.checked)} /> {t("remote")}</label>
        <textarea value={f.description} onChange={(e) => set("description", e.target.value)} placeholder={t("description")} rows={2} className={fld} />
        <textarea value={f.responsibilities} onChange={(e) => set("responsibilities", e.target.value)} placeholder={t("responsibilities")} rows={2} className={fld} />
        <ListEditor label={t("requirements")} items={f.requirements} onChange={(v) => set("requirements", v)} />
        <ListEditor label={t("requiredDocuments")} items={f.requiredDocuments} onChange={(v) => set("requiredDocuments", v)} />
        <ListEditor label={t("skills")} items={f.skills} onChange={(v) => set("skills", v)} />
        {err && <p className="text-sm text-destructive">{err}</p>}
        <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg bg-secondary px-4 py-2 text-sm font-bold">{t("cancel")}</button>
          <button type="button" onClick={() => void save()} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">{t("save")}</button></div>
      </div>
    </ScreenModal>
  );
}
