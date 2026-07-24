import { useI18n } from "@shared/i18n";
import type { TranslationKey } from "@shared/i18n";
import { MobileCard } from "@shared/components/MobileCard";
import type { InventoryCount, CountStatus, CountType } from "@fieldops/domain/inventory-count.types";

const BADGE: Record<CountStatus, string> = { draft: "bg-secondary text-foreground", in_progress: "bg-blue-500/10 text-blue-600", completed: "bg-amber-500/10 text-amber-600", approved: "bg-primary/10 text-primary", applied: "bg-green-500/10 text-green-600", cancelled: "bg-destructive/10 text-destructive" };
const ST: Record<CountStatus, TranslationKey> = { draft: "csDraft", in_progress: "csInProgress", completed: "csCompleted", approved: "csApproved", applied: "csApplied", cancelled: "csCancelled" };
const TY: Record<CountType, TranslationKey> = { full: "fullCount", partial: "partialCount", category: "categoryCount", low_stock: "lowStockCount" };
const active = (s: CountStatus) => s === "draft" || s === "in_progress";

export function CountsTable({ counts, onOpen, onCancel }: { counts: readonly InventoryCount[]; onOpen: (id: string) => void; onCancel: (id: string) => void }) {
  const { t } = useI18n();
  const th = "px-3 py-2 text-left font-bold";
  const badge = (c: InventoryCount) => <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${BADGE[c.status]}`}>{t(ST[c.status])}</span>;
  const prog = (c: InventoryCount) => `${c.countedLines}/${c.totalLines}`;
  return (
    <>
    <div className="hidden overflow-hidden rounded-lg border border-border bg-card md:block">
      <div className="overflow-x-auto"><table className="w-full font-body text-sm">
        <thead className="bg-secondary text-xs uppercase text-muted-foreground"><tr>
          <th className={th}>{t("countNumber")}</th><th className={th}>{t("countType")}</th><th className={th}>{t("status")}</th><th className={th}>{t("assignTo")}</th><th className={`${th} text-right`}>{t("countProgress")}</th><th className={`${th} text-right`}>{t("itemsWithVariance")}</th><th className={`${th} text-right`}>{t("actions")}</th>
        </tr></thead>
        <tbody>
          {counts.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">{t("noRecords")}</td></tr>}
          {counts.map((c) => (
            <tr key={c.id} className="border-t border-border hover:bg-secondary">
              <td className="cursor-pointer px-3 py-2 font-semibold" onClick={() => onOpen(c.id)}>{c.countNumber}</td>
              <td className="px-3 py-2 text-muted-foreground">{t(TY[c.countType])}</td>
              <td className="px-3 py-2">{badge(c)}</td>
              <td className="px-3 py-2 text-muted-foreground">{c.assignedToName ?? "—"}</td>
              <td className="px-3 py-2 text-right">{prog(c)}</td>
              <td className="px-3 py-2 text-right font-semibold">{c.varianceLines || "—"}</td>
              <td className="px-3 py-2 text-right"><button type="button" onClick={() => onOpen(c.id)} className="font-bold text-primary">{t("view")}</button>{active(c.status) && <button type="button" onClick={() => onCancel(c.id)} className="ml-3 text-destructive">{t("cancel")}</button>}</td>
            </tr>
          ))}
        </tbody>
      </table></div>
    </div>
    <div className="space-y-2 md:hidden">
      {counts.map((c) => <MobileCard key={c.id} title={c.countNumber} extra={badge(c)} lines={[`${t(TY[c.countType])} · ${prog(c)}`, c.assignedToName ?? ""]} onView={() => onOpen(c.id)} />)}
    </div>
    </>
  );
}
