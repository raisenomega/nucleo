import { X } from "lucide-react";
import { useI18n, type TranslationKey } from "@shared/i18n";
import { CATEGORIES, CAT_KEY } from "@hr/presentation/onboarding-ui";
import type { TemplateTask, TaskCategory } from "@hr/domain/onboarding.types";

type Assign = TemplateTask["assignedTo"];
const ASSIGN: Assign[] = ["employee", "admin", "mentor"];
const AKEY = (a: Assign): TranslationKey => (a === "admin" ? "assignedToAdmin" : a === "mentor" ? "mentor" : "assignedToEmployee");

export function TemplateTaskEditor({ task, onChange, onRemove }: { task: TemplateTask; onChange: (t: TemplateTask) => void; onRemove: () => void }) {
  const { t } = useI18n();
  const set = (patch: Partial<TemplateTask>) => onChange({ ...task, ...patch });
  const fld = "rounded border border-border bg-background p-1.5 text-sm";
  return (
    <div className="space-y-2 rounded-lg border border-border p-2">
      <div className="flex gap-1">
        <input value={task.title} onChange={(e) => set({ title: e.target.value })} placeholder={t("taskTitle")} className={`${fld} w-full`} />
        <button type="button" onClick={onRemove} aria-label={t("delete")} className="shrink-0 text-destructive"><X className="h-4 w-4" /></button>
      </div>
      <div className="grid grid-cols-3 gap-1">
        <select value={task.category} onChange={(e) => set({ category: e.target.value as TaskCategory })} className={fld}>{CATEGORIES.map((c) => <option key={c} value={c}>{t(CAT_KEY[c])}</option>)}</select>
        <select value={task.assignedTo} onChange={(e) => set({ assignedTo: e.target.value as Assign })} className={fld}>{ASSIGN.map((a) => <option key={a} value={a}>{t(AKEY(a))}</option>)}</select>
        <input type="number" min="0" value={task.dueDays} onChange={(e) => set({ dueDays: Number(e.target.value) })} placeholder={t("dueDate")} className={fld} />
      </div>
      <div className="flex gap-4 text-sm">
        <label className="flex items-center gap-1"><input type="checkbox" checked={task.requiresSignature} onChange={(e) => set({ requiresSignature: e.target.checked })} /> {t("signContract")}</label>
        <label className="flex items-center gap-1"><input type="checkbox" checked={task.requiresDocument} onChange={(e) => set({ requiresDocument: e.target.checked })} /> {t("uploadDocument")}</label>
      </div>
    </div>
  );
}
