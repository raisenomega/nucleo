import { DollarSign, XCircle, MessageCircle, FileText } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import { MobileCard } from "@shared/components/MobileCard";
import type { AccountReceivable } from "@finance/domain/accounts-receivable.types";

// wa.me exige código de país: si es local NANP (10 dígitos) anteponemos "1".
const wa = (phone: string, msg: string) => {
  const d = phone.replace(/\D/g, ""); const full = d.length === 10 ? `1${d}` : d;
  return `https://wa.me/${full}?text=${encodeURIComponent(msg)}`;
};

// Deudas pendientes: tabla en desktop, cards en mobile. Acciones = iconos en fila (16px, hover opacity).
export function AccountsReceivableTable({ rows, onCollect, onForgive, onNote }: {
  rows: readonly AccountReceivable[]; onCollect?: (r: AccountReceivable) => void;
  onForgive?: (r: AccountReceivable) => void; onNote?: (r: AccountReceivable) => void;
}) {
  const { t } = useI18n();
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">{t("noRecords")}</p>;
  const msg = (r: AccountReceivable) => `Hola ${r.clientName}, le recordamos que tiene un balance pendiente de ${formatCurrency(r.amount)} por el servicio del ${r.routeDate}. Favor comunicarse para coordinar el pago.`;
  const acts = (r: AccountReceivable) => (
    <div className="flex gap-1 pt-1">
      {onCollect && <button type="button" onClick={() => onCollect(r)} title={t("collect")} className="text-green-600 hover:opacity-70"><DollarSign className="h-4 w-4" /></button>}
      {onForgive && <button type="button" onClick={() => onForgive(r)} title={t("forgive")} className="text-red-600 hover:opacity-70"><XCircle className="h-4 w-4" /></button>}
      {r.phone
        ? <a href={wa(r.phone, msg(r))} target="_blank" rel="noreferrer" title={t("reminder")} className="text-green-600 hover:opacity-70"><MessageCircle className="h-4 w-4" /></a>
        : <span title={t("noPhone")} className="cursor-not-allowed text-muted-foreground opacity-40"><MessageCircle className="h-4 w-4" /></span>}
      {onNote && <button type="button" onClick={() => onNote(r)} title={t("addNote")} className="text-blue-600 hover:opacity-70"><FileText className="h-4 w-4" /></button>}
    </div>
  );
  return (
    <>
      <table className="hidden w-full text-sm md:table">
        <thead><tr className="border-b border-border text-left text-xs text-muted-foreground">
          <th className="p-2">{t("contactName")}</th><th className="p-2">{t("amount")}</th><th className="p-2">{t("date")}</th>
          <th className="p-2">{t("employee")}</th><th className="p-2">{t("reason")}</th><th className="p-2">{t("actions")}</th></tr></thead>
        <tbody>{rows.map((r) => (
          <tr key={r.stopId} className="border-b border-border align-top">
            <td className="p-2 font-semibold">{r.clientName}</td>
            <td className="p-2 font-bold text-primary">{formatCurrency(r.amount)}</td>
            <td className="p-2">{r.routeDate}</td><td className="p-2">{r.assignedTo}</td>
            <td className="max-w-xs whitespace-pre-line p-2 text-muted-foreground">{r.reason ?? "—"}</td>
            <td className="p-2">{acts(r)}</td></tr>))}</tbody>
      </table>
      <div className="space-y-2 md:hidden">{rows.map((r) => (
        <MobileCard key={r.stopId} title={r.clientName} amount={formatCurrency(r.amount)}
          lines={[`${r.routeDate} · ${r.assignedTo}`, r.reason ?? undefined]} extra={acts(r)} />
      ))}</div>
    </>
  );
}
