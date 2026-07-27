import { Kanban, Send, Pause, Play, XCircle, Link2 } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { STATUS_KEY, STATUS_COLOR } from "@hr/presentation/recruit-ui";
import type { JobOpening } from "@hr/domain/recruitment.types";

export function OpeningsTable({ rows, onPipeline, onPublish, onPause, onClose, onCopy }: {
  rows: readonly JobOpening[]; onPipeline: (o: JobOpening) => void; onPublish: (id: string) => void;
  onPause: (id: string) => void; onClose: (id: string) => void; onCopy: (o: JobOpening) => void;
}) {
  const { t } = useI18n();
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">{t("noRecords")}</p>;
  const btn = "flex items-center gap-1 rounded bg-secondary px-2 py-1 text-xs font-bold";
  const actions = (o: JobOpening) => (
    <div className="flex flex-wrap justify-end gap-1">
      {o.status !== "draft" && <button type="button" onClick={() => onPipeline(o)} className={btn}><Kanban className="h-3 w-3" /> {t("pipeline")}</button>}
      {(o.status === "draft" || o.status === "paused") && <button type="button" onClick={() => onPublish(o.id)} className={btn}><Send className="h-3 w-3" /> {o.status === "paused" ? t("resume") : t("publishOpening")}</button>}
      {o.status === "published" && <>
        <button type="button" onClick={() => onCopy(o)} className={btn}><Link2 className="h-3 w-3" /> {t("copyLink")}</button>
        <button type="button" onClick={() => onPause(o.id)} className={btn}><Pause className="h-3 w-3" /> {t("pause")}</button></>}
      {(o.status === "published" || o.status === "paused") && <button type="button" onClick={() => onClose(o.id)} className={btn}><XCircle className="h-3 w-3" /> {t("closeOpening")}</button>}
    </div>
  );
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b border-border text-left text-xs text-muted-foreground">
          <th className="p-2">{t("vacancyNumber")}</th><th className="p-2">{t("jobTitle")}</th><th className="p-2">{t("status")}</th>
          <th className="p-2">{t("candidateCount")}</th><th className="p-2"></th></tr></thead>
        <tbody>{rows.map((o) => (
          <tr key={o.id} className="border-b border-border">
            <td className="p-2 font-mono font-semibold">{o.openingNumber}</td><td className="p-2">{o.positionTitle}</td>
            <td className="p-2"><span className={`rounded px-2 py-0.5 text-xs font-bold ${STATUS_COLOR[o.status]}`}>{t(STATUS_KEY[o.status])}</span></td>
            <td className="p-2">{o.applicantCount}</td>
            <td className="p-2">{actions(o)}</td></tr>))}</tbody>
      </table>
    </div>
  );
}
