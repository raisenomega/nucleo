import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import { MobileCard } from "@shared/components/MobileCard";
import type { AccountReceivable } from "@finance/domain/accounts-receivable.types";

// Deudas pendientes: tabla en desktop, cards en mobile. Acciones Cobrar/Perdonar (si onCollect/onForgive).
export function AccountsReceivableTable({ rows, onCollect, onForgive }: {
  rows: readonly AccountReceivable[]; onCollect?: (r: AccountReceivable) => void; onForgive?: (r: AccountReceivable) => void;
}) {
  const { t } = useI18n();
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">{t("noRecords")}</p>;
  const acts = (onCollect || onForgive) ? (r: AccountReceivable) => (
    <div className="flex gap-2 pt-1">
      {onCollect && <button type="button" onClick={() => onCollect(r)} className="rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-sm font-bold">{t("collect")}</button>}
      {onForgive && <button type="button" onClick={() => onForgive(r)} className="rounded-lg bg-secondary px-3 py-1.5 text-sm">{t("forgive")}</button>}
    </div>
  ) : undefined;
  return (
    <>
      <table className="hidden w-full text-sm md:table">
        <thead><tr className="border-b border-border text-left text-xs text-muted-foreground">
          <th className="p-2">{t("contactName")}</th><th className="p-2">{t("amount")}</th><th className="p-2">{t("date")}</th>
          <th className="p-2">{t("employee")}</th><th className="p-2">{t("reason")}</th><th className="p-2">{t("actions")}</th></tr></thead>
        <tbody>{rows.map((r) => (
          <tr key={r.stopId} className="border-b border-border">
            <td className="p-2 font-semibold">{r.clientName}</td>
            <td className="p-2 font-bold text-primary">{formatCurrency(r.amount)}</td>
            <td className="p-2">{r.routeDate}</td><td className="p-2">{r.assignedTo}</td>
            <td className="p-2 text-muted-foreground">{r.reason ?? "—"}</td>
            <td className="p-2">{acts?.(r)}</td></tr>))}</tbody>
      </table>
      <div className="space-y-2 md:hidden">{rows.map((r) => (
        <MobileCard key={r.stopId} title={r.clientName} amount={formatCurrency(r.amount)}
          lines={[`${r.routeDate} · ${r.assignedTo}`, r.reason ?? undefined]} extra={acts?.(r)} />
      ))}</div>
    </>
  );
}
