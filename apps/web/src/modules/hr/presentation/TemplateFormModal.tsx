import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { supabase } from "@shared/lib/supabase";
import { ScreenModal } from "@shared/components/ScreenModal";
import { TemplateTaskEditor } from "@hr/presentation/TemplateTaskEditor";
import type { OnboardingTemplate, TemplateFormData, TemplateTask, OnbResult } from "@hr/domain/onboarding.types";

const newTask = (): TemplateTask => ({ id: "t" + Math.random().toString(36).slice(2, 7), title: "", description: "",
  category: "other", assignedTo: "employee", requiresSignature: false, requiresDocument: false, dueDays: 7, order: 0 });

export function TemplateFormModal({ initial, onSubmit, onClose }: {
  initial?: OnboardingTemplate; onSubmit: (d: TemplateFormData) => Promise<OnbResult>; onClose: () => void;
}) {
  const { t } = useI18n();
  const [f, setF] = useState<TemplateFormData>(initial
    ? { name: initial.name, positionId: initial.positionId, isDefault: initial.isDefault, tasks: initial.tasks.map((x) => ({ ...x })) }
    : { name: "", positionId: null, isDefault: false, tasks: [newTask()] });
  const [positions, setPositions] = useState<{ id: string; title: string }[]>([]);
  const [err, setErr] = useState("");
  useEffect(() => { void supabase.from("job_positions").select("id,title").eq("is_active", true).then(({ data }) => setPositions((data as { id: string; title: string }[]) ?? [])); }, []);
  const set = (patch: Partial<TemplateFormData>) => setF((p) => ({ ...p, ...patch }));
  async function save() {
    if (!f.name.trim() || f.tasks.length === 0) { setErr(t("requiredFields")); return; }
    const r = await onSubmit({ ...f, tasks: f.tasks.map((x, i) => ({ ...x, order: i + 1 })) });
    if (r.ok) onClose(); else setErr(r.error);
  }
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  return (
    <ScreenModal onClose={onClose}>
      <div className="space-y-3 p-4 md:p-6">
        <h2 className="font-display text-lg font-bold text-foreground">{initial ? t("onboardingTemplate") : t("createTemplate")}</h2>
        <input value={f.name} onChange={(e) => set({ name: e.target.value })} placeholder={t("onboardingTemplate")} className={fld} />
        <div className="grid grid-cols-2 gap-2">
          <select value={f.positionId ?? ""} onChange={(e) => set({ positionId: e.target.value || null })} className={fld}><option value="">{t("defaultTemplate")}</option>{positions.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.isDefault} onChange={(e) => set({ isDefault: e.target.checked })} /> {t("defaultTemplate")}</label>
        </div>
        <div className="space-y-2">
          {f.tasks.map((task, i) => <TemplateTaskEditor key={task.id} task={task} onChange={(nt) => set({ tasks: f.tasks.map((x, j) => (j === i ? nt : x)) })} onRemove={() => set({ tasks: f.tasks.filter((_, j) => j !== i) })} />)}
          <button type="button" onClick={() => set({ tasks: [...f.tasks, newTask()] })} className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-2 text-sm font-bold"><Plus className="h-4 w-4" /> {t("addTask")}</button>
        </div>
        {err && <p className="text-sm text-destructive">{err}</p>}
        <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg bg-secondary px-4 py-2 text-sm font-bold">{t("cancel")}</button>
          <button type="button" onClick={() => void save()} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">{t("save")}</button></div>
      </div>
    </ScreenModal>
  );
}
