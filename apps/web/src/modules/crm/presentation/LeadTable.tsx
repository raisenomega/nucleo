import { Eye, FileText, MessageCircle, Pencil, Receipt, Trash2 } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
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
            <th className={th}>{t("phone")}</th><th className={th}>{t("leadSource")}</th>
            <th className={th}>{t("serviceRequested")}</th><th className={th}>{t("temperature")}</th>
            <th className={th}>{t("status")}</th><th className={`${th} text-right`}>{t("total")}</th>
            <th className={`${th} text-right`}>{t("actions")}</th>
          </tr></thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={9} className="py-8 text-center text-muted-foreground">{t("noRecords")}</td></tr>
            )}
            {rows.map((l) => (
              <tr key={l.id} className="border-t border-border">
                <td className="px-3 py-2">{l.callDate}</td>
                <td className="px-3 py-2">
                  <button type="button" onClick={() => onView(l.id)} className="font-medium text-primary hover:underline">{l.contactName}</button>
                </td>
                <td className="px-3 py-2"><a href={`tel:${l.phone}`} className="text-primary hover:underline">{l.phone}</a></td>
                <td className="px-3 py-2">{l.leadSourceLabel || "—"}</td>
                <td className="px-3 py-2">{l.serviceTypeLabel || "—"}</td>
                <td className="px-3 py-2"><TempBadge value={l.temperature} /></td>
                <td className="px-3 py-2"><StatusBadge value={l.status} /></td>
                <td className="px-3 py-2 text-right font-semibold">{formatCurrency(l.quotedPrice)}</td>
                <td className="px-3 py-2">
                  <div className="flex justify-end gap-2">
                    <button type="button" aria-label={t("whatsapp")} className="text-green-600"
                      onClick={() => window.open(`https://wa.me/${l.phone.replace(/\D/g, "")}?text=${encodeURIComponent(t("whatsappMessage", { name: l.contactName, total: formatCurrency(l.quotedPrice) }))}`, "_blank")}><MessageCircle className="h-4 w-4" /></button>
                    <button type="button" onClick={() => window.alert(t("quotePlaceholder"))} aria-label={t("quote")} className="text-primary"><FileText className="h-4 w-4" /></button>
                    <button type="button" onClick={() => window.alert(t("invoicePlaceholder"))} aria-label={t("invoice")} className="text-primary"><Receipt className="h-4 w-4" /></button>
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
