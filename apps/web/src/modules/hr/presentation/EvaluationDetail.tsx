import { X, AlertTriangle } from "lucide-react";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from "recharts";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import { CLASS_COLOR, CLASS_KEY } from "@hr/presentation/eval-ui";
import type { EvaluationDetail as ED } from "@hr/domain/evaluation.types";

// Detalle: radar de scores por criterio + composite + clasificación + Ley 80 + notas.
export function EvaluationDetail({ ev, onClose }: { ev: ED; onClose: () => void }) {
  const { t } = useI18n();
  const data = ev.scores.map((s) => ({ criterion: s.label, score: s.score }));
  return (
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-display text-lg font-bold text-primary">{ev.employeeName} — {ev.period}</h2>
        <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
      </div>
      <div className="space-y-4 p-4">
        <div className={`flex items-center justify-between rounded-lg p-3 ${ev.classification ? CLASS_COLOR[ev.classification] : "bg-secondary"}`}>
          <span className="text-2xl font-bold">{ev.compositeScore.toFixed(2)}</span>
          <span className="font-bold">{ev.classification ? t(CLASS_KEY[ev.classification]) : ev.status}</span></div>
        {ev.requiresLegalValidation && (
          <div className="flex gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            <AlertTriangle className="h-5 w-5 shrink-0" /><span>{t("legalWarning")}</span></div>)}
        {data.length > 0 && (
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={data}><PolarGrid /><PolarAngleAxis dataKey="criterion" tick={{ fontSize: 11 }} />
              <Radar dataKey="score" stroke="hsl(38 85% 55%)" fill="hsl(38 85% 55%)" fillOpacity={0.5} /></RadarChart>
          </ResponsiveContainer>)}
        {ev.notes && <div className="rounded-lg bg-secondary p-3 text-sm"><span className="font-bold">{t("notes")}: </span>{ev.notes}</div>}
      </div>
    </ScreenModal>
  );
}
