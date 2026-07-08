import { useState } from "react";
import { useI18n } from "@shared/i18n";
import { FREQ, FREQ_KEY } from "@billing/presentation/billing-ui";
import type { BillingPlanInput, PlanFrequency } from "@billing/domain/billing-plan.types";
import type { BillingResult } from "@billing/domain/invoice.types";

export function BillingPlanForm({ onSubmit, onCancel }: {
  onSubmit: (d: BillingPlanInput) => Promise<BillingResult>; onCancel: () => void;
}) {
  const { t } = useI18n();
  const [clientName, setClientName] = useState("");
  const [phone, setPhone] = useState(""); const [email, setEmail] = useState("");
  const [amount, setAmount] = useState(""); const [frequency, setFrequency] = useState<PlanFrequency>("monthly");
  const [service, setService] = useState(""); const [start, setStart] = useState(""); const [busy, setBusy] = useState(false);
  async function submit() {
    if (!clientName.trim() || !amount || !start) return; setBusy(true);
    const r = await onSubmit({ clientName: clientName.trim(), phone, email, amount: Number(amount), frequency, serviceDescription: service, nextBillingDate: start });
    setBusy(false); if (!r.ok) window.alert(r.error); else onCancel();
  }
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  return (
    <form onSubmit={(e) => { e.preventDefault(); void submit(); }} className="space-y-3 rounded-lg border border-border bg-card p-5">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <input required value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder={t("clientName")} className={fld} />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t("phone")} className={fld} />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("email")} className={fld} />
        <input required type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={t("amount")} className={fld} />
        <select value={frequency} onChange={(e) => setFrequency(e.target.value as PlanFrequency)} className={fld}>
          {FREQ.map((f) => <option key={f} value={f}>{t(FREQ_KEY[f])}</option>)}</select>
        <label className="space-y-1"><span className="text-xs font-bold text-muted-foreground">{t("nextBilling")}</span>
          <input required type="date" value={start} onChange={(e) => setStart(e.target.value)} className={fld} /></label>
      </div>
      <input value={service} onChange={(e) => setService(e.target.value)} placeholder={t("serviceDescription")} className={fld} />
      <div className="flex gap-2">
        <button type="submit" disabled={busy} className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold disabled:opacity-50">{t("save")}</button>
        <button type="button" onClick={onCancel} className="rounded-lg bg-secondary px-4 py-2 text-sm">{t("cancel")}</button>
      </div>
    </form>
  );
}
