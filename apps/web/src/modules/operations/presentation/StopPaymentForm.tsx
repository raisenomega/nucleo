import { useEffect, useState } from "react";
import { supabase } from "@shared/lib/supabase";
import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import type { RouteStop, CompletePayload } from "@operations/domain/route.types";

type Cat = { id: string; label: string };

// Cobro de la parada. Si el método es Efectivo, calcula el cambio. Usa select propio (necesita id + label).
export function StopPaymentForm({ stop, onSubmit }: { stop: RouteStop; onSubmit: (p: CompletePayload) => void }) {
  const { t } = useI18n();
  const [methods, setMethods] = useState<Cat[]>([]);
  const [amount, setAmount] = useState(stop.estimatedAmount);
  const [methodId, setMethodId] = useState("");
  const [received, setReceived] = useState(0);
  useEffect(() => { void supabase.from("categories").select("id,label").eq("kind", "payment_method").eq("active", true).order("sort").then(({ data }) => setMethods((data as Cat[] | null) ?? [])); }, []);
  const cash = methods.find((m) => m.id === methodId)?.label === "Efectivo";
  const change = cash && received > amount ? received - amount : 0;
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  const lbl = "text-xs font-bold text-muted-foreground";
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ amount, paymentMethodId: methodId, received: cash ? received : null, change: cash ? change : null, evidence: stop.evidenceUrls }); }}
      className="space-y-2 rounded-lg border border-border bg-card p-3">
      <label className="block space-y-1"><span className={lbl}>{t("amount")}</span>
        <input type="number" step="0.01" min="0" value={amount || ""} onChange={(e) => setAmount(Number(e.target.value))} className={fld} /></label>
      <label className="block space-y-1"><span className={lbl}>{t("paymentMethod")}</span>
        <select required value={methodId} onChange={(e) => setMethodId(e.target.value)} className={fld}>
          <option value="">—</option>{methods.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}</select></label>
      {cash && (
        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1"><span className={lbl}>{t("amountReceived")}</span>
            <input type="number" step="0.01" min="0" value={received || ""} onChange={(e) => setReceived(Number(e.target.value))} className={fld} /></label>
          <div><span className={lbl}>{t("changeAmount")}</span><p className="p-2 text-sm font-bold text-primary">{formatCurrency(change)}</p></div>
        </div>
      )}
      <button type="submit" disabled={!methodId} className="w-full rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold disabled:opacity-50">{t("completeAndCollect")}</button>
    </form>
  );
}
