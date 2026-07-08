import { Trash2 } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { MobileCard } from "@shared/components/MobileCard";
import type { Course } from "@hr/domain/training.types";

export function CourseTable({ rows, onDelete }: { rows: readonly Course[]; onDelete?: (id: string) => void }) {
  const { t } = useI18n();
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">{t("noRecords")}</p>;
  const req = (c: Course) => c.required ? <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">{t("required")}</span> : null;
  const del = (c: Course) => onDelete ? <button type="button" onClick={() => onDelete(c.id)} aria-label={t("delete")} className="text-destructive"><Trash2 className="h-4 w-4" /></button> : null;
  return (
    <>
      <table className="hidden w-full text-sm md:table">
        <thead><tr className="border-b border-border text-left text-xs text-muted-foreground">
          <th className="p-2">{t("courseTitle")}</th><th className="p-2">{t("category")}</th><th className="p-2">{t("hours")}</th><th className="p-2"></th><th className="p-2"></th></tr></thead>
        <tbody>{rows.map((c) => (
          <tr key={c.id} className="border-b border-border">
            <td className="p-2 font-semibold">{c.title}</td><td className="p-2">{c.category ?? "—"}</td>
            <td className="p-2">{c.hours ?? "—"}</td><td className="p-2">{req(c)}</td>
            <td className="p-2 text-right">{del(c)}</td></tr>))}</tbody>
      </table>
      <div className="space-y-2 md:hidden">{rows.map((c) => (
        <MobileCard key={c.id} title={c.title} lines={[[c.category, c.hours != null ? `${c.hours}h` : null].filter(Boolean).join(" · ")]}
          extra={req(c)} onDelete={onDelete ? () => onDelete(c.id) : undefined} />))}</div>
    </>
  );
}
