import { useState } from "react";
import { Plus, Play, Eye } from "lucide-react";
import { useI18n, type TranslationKey } from "@shared/i18n";
import { useToast } from "@shared/providers/toast-context";
import { useCycles } from "@hr/application/useCycles.hook";
import { supabaseEvalCycleRepository } from "@hr/infrastructure/supabase-evalcycle.repository";
import { CycleFormModal } from "@hr/presentation/CycleFormModal";
import { CycleDetail } from "@hr/presentation/CycleDetail";
import type { Criterion } from "@hr/domain/evaluation.types";
import type { EvaluationCycle } from "@hr/domain/evalcycle.types";

export function CyclesTab({ criteria }: { criteria: readonly Criterion[] }) {
  const { t } = useI18n();
  const toast = useToast();
  const m = useCycles(supabaseEvalCycleRepository);
  const [form, setForm] = useState(false);
  const [detail, setDetail] = useState<EvaluationCycle | null>(null);
  const act = (p: Promise<{ ok: boolean; error?: string }>) => void p.then((r) => { if (!r.ok && r.error) toast.error(r.error); });
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button type="button" onClick={() => setForm(true)} className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground"><Plus className="h-4 w-4" /> {t("newCycle")}</button>
      </div>
      {m.cycles.length === 0 ? <p className="text-sm text-muted-foreground">{t("noRecords")}</p> : (
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead><tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th className="p-2">{t("evalCycle")}</th><th className="p-2">{t("closingDate")}</th><th className="p-2">{t("progress")}</th><th className="p-2">{t("status")}</th><th className="p-2"></th></tr></thead>
          <tbody>{m.cycles.map((c) => (
            <tr key={c.id} className="border-b border-border">
              <td className="p-2 font-semibold">{c.name}</td><td className="p-2">{c.evaluationDeadline.slice(5)}</td>
              <td className="p-2">{c.completedEvaluations}/{c.totalEvaluations}</td>
              <td className="p-2"><span className="rounded bg-secondary px-2 py-0.5 text-xs font-bold">{t(("cs_" + c.status) as TranslationKey)}</span></td>
              <td className="p-2"><div className="flex justify-end gap-2">
                {c.status === "draft" && <button type="button" onClick={() => act(m.activate(c.id))} className="flex items-center gap-1 text-xs font-bold text-primary"><Play className="h-3 w-3" /> {t("activateCycle")}</button>}
                {c.status !== "draft" && <button type="button" onClick={() => setDetail(c)} className="flex items-center gap-1 text-xs font-bold text-primary"><Eye className="h-3 w-3" /> {t("viewDetail")}</button>}
              </div></td></tr>))}</tbody>
        </table></div>)}
      {form && <CycleFormModal onSubmit={m.create} onClose={() => setForm(false)} />}
      {detail && <CycleDetail cycle={detail} criteria={criteria} onClose={() => { setDetail(null); void m.refresh(); }} />}
    </div>
  );
}
