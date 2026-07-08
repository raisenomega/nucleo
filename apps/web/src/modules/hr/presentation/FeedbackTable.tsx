import { Check } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { MobileCard } from "@shared/components/MobileCard";
import { FB_KEY, FB_COLOR } from "@hr/presentation/fb-ui";
import type { Feedback } from "@hr/domain/feedback.types";

// Feedback: autor oculto si anónimo. ceo/coo pueden acusar recibo.
export function FeedbackTable({ rows, names, canAck, onAck }: {
  rows: readonly Feedback[]; names: Record<string, string>; canAck: boolean; onAck: (id: string) => void;
}) {
  const { t } = useI18n();
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">{t("noRecords")}</p>;
  const author = (f: Feedback) => f.isAnonymous ? t("anonymous") : (names[f.authorId] ?? "—");
  const tgt = (f: Feedback) => f.targetId ? (names[f.targetId] ?? "—") : t("fbGeneral");
  const badge = (f: Feedback) => <span className={`rounded px-2 py-0.5 text-xs font-bold ${FB_COLOR[f.feedbackType]}`}>{t(FB_KEY[f.feedbackType])}</span>;
  const ack = (f: Feedback) => f.acknowledgedAt ? <Check className="h-4 w-4 text-green-600" />
    : (canAck ? <button type="button" onClick={() => onAck(f.id)} aria-label={t("acknowledge")} className="text-primary"><Check className="h-5 w-5" /></button> : null);
  return (
    <>
      <table className="hidden w-full text-sm md:table">
        <thead><tr className="border-b border-border text-left text-xs text-muted-foreground">
          <th className="p-2">{t("author")}</th><th className="p-2">{t("employee")}</th><th className="p-2">{t("category")}</th>
          <th className="p-2">{t("notes")}</th><th className="p-2">{t("date")}</th><th className="p-2"></th></tr></thead>
        <tbody>{rows.map((f) => (
          <tr key={f.id} className="border-b border-border align-top">
            <td className="p-2 font-semibold">{author(f)}</td><td className="p-2">{tgt(f)}</td><td className="p-2">{badge(f)}</td>
            <td className="max-w-xs p-2 text-muted-foreground">{f.content}</td><td className="p-2">{f.createdAt.slice(0, 10)}</td>
            <td className="p-2 text-right">{ack(f)}</td></tr>))}</tbody>
      </table>
      <div className="space-y-2 md:hidden">{rows.map((f) => (
        <MobileCard key={f.id} title={author(f)} lines={[f.content, `${tgt(f)} · ${f.createdAt.slice(0, 10)}`]}
          extra={<div className="flex items-center gap-2 pt-1">{badge(f)} {ack(f)}</div>} />))}</div>
    </>
  );
}
