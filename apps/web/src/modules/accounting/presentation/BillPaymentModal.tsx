import { useEffect, useState } from "react";
import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import { ScreenModal } from "@shared/components/ScreenModal";
import { useToast } from "@shared/providers/toast-context";
import { fetchPaymentMethods, type OptionRef } from "@accounting/infrastructure/ap-refs";
import type { Result } from "@accounting/domain/chart-of-accounts.types";
import type { VendorBill } from "@accounting/domain/vendor-bill.types";

type Pay = (amt: number, date: string, m: string | null, ref: string | null, notes: string | null) => Promise<Result<null, string>>;

// Registrar pago de un bill. Default = balance restante; no permite sobrepago (el backend también lo bloquea).
export function BillPaymentModal({ bill, onPay, onClose }: { bill: VendorBill; onPay: Pay; onClose: () => void }) {
  const { t } = useI18n(); const toast = useToast();
  const [methods, setMethods] = useState<OptionRef[]>([]);
  const [amount, setAmount] = useState(String(bill.balance));
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState(""); const [reference, setReference] = useState("");
  useEffect(() => { void fetchPaymentMethods().then(setMethods); }, []);
  const amt = Number(amount) || 0;
  const valid = amt > 0 && amt <= bill.balance + 0.001;
  async function save() {
    const r = await onPay(amt, date, method || null, reference || null, null);
    if (r.ok) { toast.success(t("saved")); onClose(); } else toast.error(r.error);
  }
  const inp = "w-full rounded border border-border bg-background p-2 text-sm";
  const lbl = "block space-y-1"; const cap = "text-xs font-bold text-muted-foreground";
  return (
    <ScreenModal onClose={onClose}>
      <div className="space-y-3 p-4 md:p-6">
        <h2 className="font-display text-lg font-bold text-foreground">{t("recordPayment")} · {bill.internalNumber}</h2>
        <label className={lbl}><span className={cap}>{t("amount")}</span><input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className={inp} /></label>
        <label className={lbl}><span className={cap}>{t("date")}</span><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inp} /></label>
        <label className={lbl}><span className={cap}>{t("paymentMethod")}</span><select value={method} onChange={(e) => setMethod(e.target.value)} className={inp}><option value="">—</option>{methods.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}</select></label>
        <label className={lbl}><span className={cap}>{t("reference")}</span><input value={reference} onChange={(e) => setReference(e.target.value)} className={inp} /></label>
        <p className="text-xs text-muted-foreground">{t("billBalance")}: {formatCurrency(bill.balance)}</p>
        {!valid && amt > 0 && <p className="text-xs text-destructive">{t("overpayment")}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg bg-secondary px-4 py-2 text-sm font-bold">{t("cancelBtn")}</button>
          <button type="button" disabled={!valid} onClick={() => void save()} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">{t("saveBtn")}</button>
        </div>
      </div>
    </ScreenModal>
  );
}
