import { useState } from "react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import { ListEditor } from "@hr/presentation/ListEditor";
import type { OpeningFormData, JobPosition, RecruitResult } from "@hr/domain/recruitment.types";

export function OpeningFormModal({ positions, preselect, onSubmit, onClose }: {
  positions: readonly JobPosition[]; preselect?: string;
  onSubmit: (d: OpeningFormData) => Promise<RecruitResult>; onClose: () => void;
}) {
  const { t } = useI18n();
  const [positionId, setPositionId] = useState(preselect ?? "");
  const [closesAt, setClosesAt] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [err, setErr] = useState("");
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  async function save() {
    if (!positionId) { setErr(t("requiredFields")); return; }
    const r = await onSubmit({ positionId, closesAt: closesAt || null, customQuestions: questions.filter(Boolean), notes });
    if (r.ok) onClose(); else setErr(r.error);
  }
  return (
    <ScreenModal onClose={onClose}>
      <div className="space-y-3 p-4 md:p-6">
        <h2 className="font-display text-lg font-bold text-foreground">{t("createOpening")}</h2>
        <label className="block space-y-1"><span className="text-xs font-bold text-muted-foreground">{t("jobTitle")}</span>
          <select value={positionId} onChange={(e) => setPositionId(e.target.value)} className={fld}>
            <option value="">—</option>{positions.filter((p) => p.isActive).map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select></label>
        <label className="block space-y-1"><span className="text-xs font-bold text-muted-foreground">{t("closingDate")}</span>
          <input type="date" value={closesAt} onChange={(e) => setClosesAt(e.target.value)} className={fld} /></label>
        <ListEditor label={t("customQuestions")} items={questions} onChange={setQuestions} placeholder={t("customQuestions")} />
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("notes")} rows={2} className={fld} />
        {err && <p className="text-sm text-destructive">{err}</p>}
        <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg bg-secondary px-4 py-2 text-sm font-bold">{t("cancel")}</button>
          <button type="button" onClick={() => void save()} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">{t("save")}</button></div>
      </div>
    </ScreenModal>
  );
}
