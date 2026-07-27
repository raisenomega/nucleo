import { useState } from "react";
import { useI18n, type TranslationKey } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import type { CycleFormData, CycleResult } from "@hr/domain/evalcycle.types";

const PERSPS = ["top_down", "self", "bottom_up"];
const TYPES = ["monthly", "quarterly", "semi_annual", "annual", "custom"];
const PKEY: Record<string, TranslationKey> = { top_down: "evTopDown", self: "evSelf", bottom_up: "evBottomUp" };

export function CycleFormModal({ onSubmit, onClose }: { onSubmit: (d: CycleFormData) => Promise<CycleResult>; onClose: () => void }) {
  const { t } = useI18n();
  const [f, setF] = useState<CycleFormData>({ name: "", cycleType: "quarterly", periodStart: "", periodEnd: "", evaluationStart: "", evaluationDeadline: "", perspectives: ["top_down", "self"] });
  const [err, setErr] = useState("");
  const set = (patch: Partial<CycleFormData>) => setF((p) => ({ ...p, ...patch }));
  const toggle = (x: string) => set({ perspectives: f.perspectives.includes(x) ? f.perspectives.filter((p) => p !== x) : [...f.perspectives, x] });
  async function save() {
    if (!f.name.trim() || !f.periodStart || !f.evaluationDeadline) { setErr(t("requiredFields")); return; }
    const r = await onSubmit({ ...f, periodEnd: f.periodEnd || f.periodStart, evaluationStart: f.evaluationStart || f.periodStart });
    if (r.ok) onClose(); else setErr(r.error);
  }
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  const lbl = "text-xs font-bold text-muted-foreground";
  return (
    <ScreenModal onClose={onClose}>
      <div className="space-y-3 p-4 md:p-6">
        <h2 className="font-display text-lg font-bold text-foreground">{t("newCycle")}</h2>
        <input value={f.name} onChange={(e) => set({ name: e.target.value })} placeholder={t("evalCycle")} className={fld} />
        <select value={f.cycleType} onChange={(e) => set({ cycleType: e.target.value })} className={fld}>{TYPES.map((x) => <option key={x} value={x}>{t(("ct_" + x) as TranslationKey)}</option>)}</select>
        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1"><span className={lbl}>{t("periodStart")}</span><input type="date" value={f.periodStart} onChange={(e) => set({ periodStart: e.target.value })} className={fld} /></label>
          <label className="space-y-1"><span className={lbl}>{t("periodEnd")}</span><input type="date" value={f.periodEnd} onChange={(e) => set({ periodEnd: e.target.value })} className={fld} /></label>
          <label className="space-y-1"><span className={lbl}>{t("evalStart")}</span><input type="date" value={f.evaluationStart} onChange={(e) => set({ evaluationStart: e.target.value })} className={fld} /></label>
          <label className="space-y-1"><span className={lbl}>{t("closingDate")}</span><input type="date" value={f.evaluationDeadline} onChange={(e) => set({ evaluationDeadline: e.target.value })} className={fld} /></label>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">{PERSPS.map((p) => (
          <label key={p} className="flex items-center gap-1"><input type="checkbox" checked={f.perspectives.includes(p)} onChange={() => toggle(p)} /> {t(PKEY[p] ?? "evTopDown")}</label>))}</div>
        {err && <p className="text-sm text-destructive">{err}</p>}
        <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg bg-secondary px-4 py-2 text-sm font-bold">{t("cancel")}</button>
          <button type="button" onClick={() => void save()} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">{t("save")}</button></div>
      </div>
    </ScreenModal>
  );
}
