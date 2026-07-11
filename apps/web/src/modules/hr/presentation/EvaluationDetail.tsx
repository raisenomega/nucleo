import { useEffect, useState } from "react";
import { X, AlertTriangle, FileDown } from "lucide-react";
import { usePdf } from "@shared/hooks/usePdf";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from "recharts";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import { CLASS_COLOR, CLASS_KEY } from "@hr/presentation/eval-ui";
import { CAT_COLOR, CAT_KEY } from "@hr/presentation/obs-ui";
import { FB_KEY, FB_COLOR } from "@hr/presentation/fb-ui";
import { supabaseObservationRepository } from "@hr/infrastructure/supabase-observation.repository";
import { supabaseFeedbackRepository } from "@hr/infrastructure/supabase-feedback.repository";
import { supabaseTrainingRepository } from "@hr/infrastructure/supabase-training.repository";
import type { Observation } from "@hr/domain/observation.types";
import type { Feedback } from "@hr/domain/feedback.types";
import type { EvaluationDetail as ED } from "@hr/domain/evaluation.types";

// Detalle: radar + composite + Ley 80 + notas + observaciones + feedback del empleado (contexto para el evaluador).
export function EvaluationDetail({ ev, onClose }: { ev: ED; onClose: () => void }) {
  const { t } = useI18n();
  const pdf = usePdf();
  const data = ev.scores.map((s) => ({ criterion: s.label, score: s.score }));
  const [obs, setObs] = useState<Observation[]>([]);
  const [fb, setFb] = useState<Feedback[]>([]);
  const [trPct, setTrPct] = useState<number | null>(null);
  useEffect(() => {
    void supabaseObservationRepository.listForEmployee(ev.employeeId).then(setObs);
    void supabaseFeedbackRepository.listForTarget(ev.employeeId).then(setFb);
    void supabaseTrainingRepository.listForEmployee(ev.employeeId).then((e) =>
      setTrPct(e.length ? Math.round(100 * e.filter((x) => x.status === "completed").length / e.length) : null));
  }, [ev.employeeId]);
  return (
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-display text-lg font-bold text-primary">{ev.employeeName} — {ev.period}</h2>
        <div className="flex items-center gap-3">
          <button type="button" disabled={pdf.generating} onClick={() => void pdf.generatePdf("evaluation", ev.id)} aria-label={t("downloadPdf")} className="text-muted-foreground hover:text-foreground disabled:opacity-50"><FileDown className="h-5 w-5" /></button>
          <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button></div>
      </div>
      <div className="space-y-4 p-4">
        <div className={`flex items-center justify-between rounded-lg p-3 ${ev.classification ? CLASS_COLOR[ev.classification] : "bg-secondary"}`}>
          <span className="text-2xl font-bold">{ev.compositeScore.toFixed(2)}</span>
          <span className="font-bold">{ev.classification ? t(CLASS_KEY[ev.classification]) : ev.status}</span></div>
        {ev.requiresLegalValidation && (
          <div className="flex gap-2 rounded-lg bg-red-50 dark:bg-red-500/15 p-3 text-sm text-red-700 dark:text-red-300">
            <AlertTriangle className="h-5 w-5 shrink-0" /><span>{t("legalWarning")}</span></div>)}
        {trPct != null && <p className="text-sm text-muted-foreground">{t("trainingPct")}: <span className="font-bold text-primary">{trPct}%</span></p>}
        {data.length > 0 && (
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={data}><PolarGrid /><PolarAngleAxis dataKey="criterion" tick={{ fontSize: 11 }} />
              <Radar dataKey="score" stroke="hsl(38 85% 55%)" fill="hsl(38 85% 55%)" fillOpacity={0.5} /></RadarChart>
          </ResponsiveContainer>)}
        {ev.notes && <div className="rounded-lg bg-secondary p-3 text-sm"><span className="font-bold">{t("notes")}: </span>{ev.notes}</div>}
        {obs.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{t("recentObservations")}</p>
            {obs.map((o) => (
              <div key={o.id} className="rounded-lg border border-border p-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className={`rounded px-2 py-0.5 text-xs font-bold ${CAT_COLOR[o.category]}`}>{t(CAT_KEY[o.category])}</span>
                  <span className="text-xs text-muted-foreground">{o.createdAt.slice(0, 10)}</span></div>
                <p className="mt-1 text-muted-foreground">{o.notes}</p></div>))}
          </div>)}
        {fb.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{t("periodFeedback")}</p>
            {fb.map((f) => (
              <div key={f.id} className="rounded-lg border border-border p-2 text-sm">
                <span className={`rounded px-2 py-0.5 text-xs font-bold ${FB_COLOR[f.feedbackType]}`}>{t(FB_KEY[f.feedbackType])}</span>
                <p className="mt-1 text-muted-foreground">{f.content}</p>
                {f.aiSentiment && <p className="text-xs text-muted-foreground">IA: {f.aiSentiment}</p>}</div>))}
          </div>)}
      </div>
    </ScreenModal>
  );
}
