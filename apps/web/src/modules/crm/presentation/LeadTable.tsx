import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { FileText, MessageCircle, Pencil, Receipt, Trash2 } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { formatCurrency } from "@shared/lib/format";
import { MobileCard } from "@shared/components/MobileCard";
import { Pagination } from "@shared/components/Pagination";
import { StatusBadge, TempBadge } from "@crm/presentation/LeadBadges";
import { leadQuoteId, leadInvoiceId, leadWaHref } from "@crm/presentation/lead-docs";
import type { Lead } from "@crm/domain/lead.types";

export function LeadTable({ rows, onView, onEdit, onDelete }: {
  rows: readonly Lead[]; onView: (id: string) => void; onEdit?: (id: string) => void; onDelete?: (id: string) => void;
}) {
  const { t } = useI18n();
  const { can } = useModuleAccess();
  const nav = useNavigate();
  const docs = can("leads", "documents");
  const th = "px-3 py-2 text-left font-bold";
  const [page, setPage] = useState(1);
  const visible = rows.slice((page - 1) * 12, page * 12);
  return (
    <>
    <div className="hidden overflow-hidden rounded-lg border border-border bg-card md:block">
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
            {rows.length === 0 && <tr><td colSpan={9} className="py-8 text-center text-muted-foreground">{t("noRecords")}</td></tr>}
            {visible.map((l) => (
              <tr key={l.id} onClick={() => onView(l.id)} className="cursor-pointer border-t border-border transition-colors hover:bg-secondary">
                <td className="px-3 py-2">{l.callDate}</td>
                <td className="px-3 py-2 font-medium text-foreground">{l.contactName}</td>
                <td className="px-3 py-2"><a href={`tel:${l.phone}`} onClick={(e) => e.stopPropagation()} className="text-foreground hover:underline">{l.phone}</a></td>
                <td className="px-3 py-2">{l.leadSource === "web-landing" ? <span className="rounded bg-accent/20 px-2 py-0.5 text-xs font-bold text-foreground">{t("webLead")}</span> : (l.leadSourceLabel || "—")}</td>
                <td className="px-3 py-2">{l.serviceTypeLabel || "—"}</td>
                <td className="px-3 py-2"><TempBadge value={l.temperature} /></td>
                <td className="px-3 py-2"><StatusBadge value={l.status} /></td>
                <td className="px-3 py-2 text-right font-semibold">{formatCurrency(l.quotedPrice)}</td>
                <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end gap-2">
                    {docs && <button type="button" aria-label={t("whatsapp")} className="text-green-600" onClick={() => window.open(leadWaHref(l, t("whatsappMessage", { name: l.contactName, total: formatCurrency(l.quotedPrice) })), "_blank")}><MessageCircle className="h-4 w-4" /></button>}
                    {docs && <button type="button" onClick={() => void leadQuoteId(l.id).then((q) => { if (q) nav({ to: "/quotes" }); })} aria-label={t("quote")} className="text-foreground"><FileText className="h-4 w-4" /></button>}
                    {docs && <button type="button" onClick={() => void leadInvoiceId(l.id).then((i) => { if (i) nav({ to: "/billing" }); })} aria-label={t("invoice")} className="text-foreground"><Receipt className="h-4 w-4" /></button>}
                    {onEdit && <button type="button" onClick={() => onEdit(l.id)} aria-label={t("edit")} className="text-foreground"><Pencil className="h-4 w-4" /></button>}
                    {onDelete && <button type="button" onClick={() => onDelete(l.id)} aria-label={t("delete")} className="text-destructive"><Trash2 className="h-4 w-4" /></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    <div className="space-y-2 md:hidden">
      {visible.map((l) => <MobileCard key={l.id} title={l.contactName} amount={formatCurrency(l.quotedPrice)}
        lines={[l.phone, `${l.leadSource === "web-landing" ? t("webLead") : (l.leadSourceLabel || "—")} · ${l.serviceTypeLabel || "—"}`]}
        extra={<div className="flex gap-2"><TempBadge value={l.temperature} /><StatusBadge value={l.status} /></div>}
        onView={() => onView(l.id)} onEdit={onEdit ? () => onEdit(l.id) : undefined} onDelete={onDelete ? () => onDelete(l.id) : undefined} />)}
    </div>
    <Pagination total={rows.length} page={page} onPageChange={setPage} />
    </>
  );
}
