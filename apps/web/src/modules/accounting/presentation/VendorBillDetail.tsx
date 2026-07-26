import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import { ScreenModal } from "@shared/components/ScreenModal";
import { BILL_STATUS_META } from "@accounting/presentation/vendor-bill-ui";
import type { VendorBill } from "@accounting/domain/vendor-bill.types";

// Detalle del bill: header + líneas + pagos + acciones según estado (aprobar / pagar / anular).
export function VendorBillDetail({ bill, canEdit, onApprove, onPayClick, onVoidBill, onVoidPayment, onClose }: {
  bill: VendorBill; canEdit: boolean; onApprove: () => void; onPayClick: () => void; onVoidBill: () => void; onVoidPayment: (id: string) => void; onClose: () => void;
}) {
  const { t } = useI18n(); const st = BILL_STATUS_META[bill.status];
  const canApprove = canEdit && (bill.status === "draft" || bill.status === "pending");
  const canPay = canEdit && (bill.status === "approved" || bill.status === "partially_paid");
  const canVoid = canEdit && bill.status !== "paid" && bill.status !== "voided";
  const btn = "rounded-lg px-3 py-2 text-sm font-bold";
  const row = (a: string, b: string, strong = false) => <div className="flex justify-between"><span className="text-muted-foreground">{a}</span><span className={strong ? "font-bold" : "font-semibold"}>{b}</span></div>;
  return (
    <ScreenModal onClose={onClose}>
      <div className="space-y-4 p-4 md:p-6">
        <div className="flex items-start justify-between gap-2">
          <div><h2 className="font-display text-lg font-bold text-foreground">{bill.internalNumber} · {bill.billNumber}</h2>
            <p className="text-sm text-muted-foreground">{bill.supplierName}{bill.poNumber ? ` · ${bill.poNumber}` : ""}</p></div>
          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${st.cls}`}>{t(st.key)}</span>
        </div>
        <div className="space-y-1 rounded-lg border border-border p-3 text-sm">
          {row(t("billDate"), bill.billDate)}
          {row(t("dueDate"), bill.dueDate + (bill.daysOverdue > 0 ? ` · ${bill.daysOverdue}d ${t("overdue")}` : ""))}
          {row(t("subtotal"), formatCurrency(bill.subtotal))}{row(t("tax"), formatCurrency(bill.taxAmount))}
          {row(t("total"), formatCurrency(bill.total), true)}{row(t("amountPaid"), formatCurrency(bill.amountPaid))}
          {row(t("billBalance"), formatCurrency(bill.balance), true)}
        </div>
        <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="text-left text-muted-foreground"><th className="py-1">{t("description")}</th><th>{t("quantity")}</th><th className="text-right">{t("price")}</th><th className="text-right">{t("total")}</th></tr></thead>
          <tbody>{bill.lines.map((l) => <tr key={l.id} className="border-t border-border"><td className="py-1">{l.description}{l.itemName ? ` · ${l.itemName}` : ""}{l.poLineId ? " ✓" : ""}</td><td>{l.quantity}</td><td className="text-right">{formatCurrency(l.unitPrice)}</td><td className="text-right">{formatCurrency(l.total)}</td></tr>)}</tbody></table></div>
        {bill.payments.length > 0 && <div className="space-y-1"><h3 className="text-xs font-bold text-muted-foreground">{t("payments")}</h3>
          {bill.payments.map((p) => <div key={p.id} className={`flex items-center justify-between text-xs ${p.voidedAt ? "text-muted-foreground line-through" : ""}`}>
            <span>{p.paymentDate} · {formatCurrency(p.amount)}{p.paymentMethodName ? ` · ${p.paymentMethodName}` : ""}</span>
            {canEdit && !p.voidedAt && <button type="button" onClick={() => onVoidPayment(p.id)} className="font-bold text-destructive">{t("voidPayment")}</button>}</div>)}</div>}
        <div className="flex flex-wrap justify-end gap-2">
          {canApprove && <button type="button" onClick={onApprove} className={`${btn} bg-blue-600 text-white`}>{t("approveBill")}</button>}
          {canPay && <button type="button" onClick={onPayClick} className={`${btn} bg-primary text-primary-foreground`}>{t("recordPayment")}</button>}
          {canVoid && <button type="button" onClick={onVoidBill} className={`${btn} bg-destructive text-white`}>{t("voidBill")}</button>}
          <button type="button" onClick={onClose} className={`${btn} bg-secondary text-foreground`}>{t("cancelBtn")}</button>
        </div>
      </div>
    </ScreenModal>
  );
}
