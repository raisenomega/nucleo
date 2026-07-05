import { Eye, Pencil, Trash2 } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { StatusBadge, TempBadge } from "@crm/presentation/LeadBadges";
import type { Lead } from "@crm/domain/lead.types";

export function LeadTable({ rows, onView, onEdit, onDelete }: {
  rows: readonly Lead[]; onView: (id: string) => void; onEdit: (id: string) => void; onDelete: (id: string) => void;
}) {
  const { t } = useI18n();
  const th = "px-3 py-2 text-left font-bold";
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="border-b border-border p-4"><h2 className="font-body font-bold">{t("leadList")} ({rows.length})</h2></div>
      <div className="overflow-x-auto">
        <table className="w-full font-body text-sm">
          <thead className="bg-secondary text-xs uppercase text-muted-foreground"><tr>
            <th className={th}>{t("callDate")}</th><th className={th}>{t("contactName")}</th>
            <th className={th}>{t("phone")}</th><th className={th}>{t("email")}</th>
            <th className={th}>{t("serviceRequested")}</th><th className={th}>{t("temperature")}</th>
            <th className={th}>{t("status")}</th><th className={`${th} text-right`}>{t("actions")}</th>
          </tr></thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">{t("noRecords")}</td></tr>
            )}
            {rows.map((l) => (
              <tr key={l.id} className="border-t border-border">
                <td className="px-3 py-2">{l.callDate}</td>
                <td className="px-3 py-2 font-medium">{l.contactName}</td>
                <td className="px-3 py-2"><a href={`tel:${l.phone}`} className="text-primary hover:underline">{l.phone}</a></td>
                <td className="px-3 py-2">{l.email ? <a href={`mailto:${l.email}`} className="text-primary hover:underline">{l.email}</a> : "—"}</td>
                <td className="px-3 py-2">{l.serviceRequested}</td>
                <td className="px-3 py-2"><TempBadge value={l.temperature} /></td>
                <td className="px-3 py-2"><StatusBadge value={l.status} /></td>
                <td className="px-3 py-2">
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => onView(l.id)} aria-label={t("viewDetail")} className="text-foreground"><Eye className="h-4 w-4" /></button>
                    <button type="button" onClick={() => onEdit(l.id)} aria-label={t("edit")} className="text-primary"><Pencil className="h-4 w-4" /></button>
                    <button type="button" onClick={() => onDelete(l.id)} aria-label={t("delete")} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
