import { useState } from "react";
import { Eye, MessageCircle, Mail, Pencil, Ban } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import { Pagination } from "@shared/components/Pagination";
import { StarRatingDisplay } from "@landing-public/presentation/StarRatingDisplay";
import type { CustomerSegment } from "@shared/customers/customer-segments.repository";
import type { AdminCustomer } from "@shared/customers/customers-agg";

const wa = (p: string) => `https://wa.me/${p.replace(/\D/g, "")}`;
// Badge de origen del cliente: portal (auto-registro), manual (alta desde el panel), landing (compró sin cuenta).
const SRC: Record<string, string> = { portal: "Portal", manual: "Manual", landing_order: "Landing", import: "Import" };

export function CustomersTable({ rows, segments = [], onView, onEdit }: { rows: readonly AdminCustomer[]; segments?: readonly CustomerSegment[]; onView: (id: string) => void; onEdit?: (c: AdminCustomer) => void }) {
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  const visible = rows.slice((page - 1) * 12, page * 12);
  const segOf = (id: string) => segments.find((s) => s.id === id);
  const th = "px-3 py-2 text-left font-bold";
  return (
    <>
      <div className="hidden overflow-hidden rounded-lg border border-border bg-card md:block"><div className="overflow-x-auto"><table className="w-full text-sm">
        <thead className="bg-secondary text-xs uppercase text-muted-foreground"><tr><th className={th}>{t("name")}</th><th className={th}>{t("email")}</th><th className={th}>{t("pPhone")}</th><th className={`${th} text-right`}>{t("cOrders")}</th><th className={`${th} text-right`}>{t("cBilled")}</th><th className={th}>{t("cLastOrder")}</th><th className={th}>{t("cRating")}</th><th className={th}>{t("status")}</th><th className={`${th} text-right`}>{t("actions")}</th></tr></thead>
        <tbody>{visible.map((c) => (
          <tr key={c.id} onClick={() => onView(c.id)} className="cursor-pointer border-t border-border hover:bg-secondary">
            <td className="px-3 py-2 font-medium">{c.fullName || "—"} <span className="ml-1 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">{SRC[c.source] ?? c.source}</span>{c.segmentId && segOf(c.segmentId) && <span className="ml-1 rounded px-1.5 py-0.5 text-[10px] font-bold text-white" style={{ backgroundColor: segOf(c.segmentId)!.color }}>{segOf(c.segmentId)!.name}</span>}{c.onHold && <Ban className="ml-1 inline h-3.5 w-3.5 text-red-500" />}</td><td className="px-3 py-2 text-muted-foreground">{c.email}</td><td className="px-3 py-2 text-muted-foreground">{c.phone || "—"}</td>
            <td className="px-3 py-2 text-right">{c.ordersCount}</td><td className="px-3 py-2 text-right font-semibold">{formatCurrency(c.totalBilled)}</td>
            <td className="px-3 py-2 text-muted-foreground">{c.lastOrderAt ? c.lastOrderAt.slice(0, 10) : "—"}</td>
            <td className="px-3 py-2">{c.avgRating ? <StarRatingDisplay value={Math.round(c.avgRating)} /> : "—"}</td>
            <td className="px-3 py-2"><span className={`rounded px-1.5 py-0.5 text-xs font-bold ${c.isActive ? "bg-green-500/10 text-green-600" : "bg-secondary text-muted-foreground"}`}>{t(c.isActive ? "cActiveSt" : "cInactiveSt")}</span></td>
            <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}><div className="flex justify-end gap-2"><button type="button" onClick={() => onView(c.id)} aria-label={t("cProfile")}><Eye className="h-4 w-4" /></button>{onEdit && <button type="button" onClick={() => onEdit(c)} aria-label={t("edit")} className="text-muted-foreground hover:text-foreground"><Pencil className="h-4 w-4" /></button>}{c.phone && <a href={wa(c.phone)} target="_blank" rel="noopener noreferrer" className="text-green-600"><MessageCircle className="h-4 w-4" /></a>}<a href={`mailto:${c.email}`} className="text-primary"><Mail className="h-4 w-4" /></a></div></td>
          </tr>))}</tbody>
      </table></div></div>
      <div className="space-y-2 md:hidden">{visible.map((c) => (
        <button key={c.id} type="button" onClick={() => onView(c.id)} className="block w-full rounded-lg border border-border bg-card p-3 text-left">
          <div className="flex justify-between"><span className="font-bold text-foreground">{c.fullName || c.email}</span><span className="text-sm font-semibold">{formatCurrency(c.totalBilled)}</span></div>
          <p className="text-xs text-muted-foreground">{c.email} · {c.ordersCount} {t("cOrders")}</p>
        </button>))}</div>
      <Pagination total={rows.length} page={page} onPageChange={setPage} />
    </>
  );
}
