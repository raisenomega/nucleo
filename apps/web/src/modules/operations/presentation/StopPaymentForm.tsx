import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { supabase } from "@shared/lib/supabase";
import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import { ScreenModal } from "@shared/components/ScreenModal";
import type { RouteStop, CompletePayload } from "@operations/domain/route.types";

type Cat = { id: string; label: string };

// Cobro a pantalla completa. Si el método es Efectivo, calcula el cambio.
export function StopPaymentForm({ stop, onClose, onSubmit }: { stop: RouteStop; onClose: () => void; onSubmit: (p: CompletePayload) => void }) {
  const { t } = useI18n();
  const [methods, setMethods] = useState<Cat[]>([]);
  const [amount, setAmount] = useState(stop.estimatedAmount);
  const [methodId, setMethodId] = useState("");
  const [received, setReceived] = useState(0);
  useEffect(() => { void supabase.from("categories").select("id,label").eq("kind", "payment_method").eq("active", true).order("sort").then(({ data }) => setMethods((data as Cat[] | null) ?? [])); }, []);
  const cash = methods.find((m) => m.id === methodId)?.label === "Efectivo";
  const change = cash && received > amount ? Math.round((received - amount) * 100) / 100 : 0;
  const fld = "h-12 w-full rounded-lg border border-border bg-background p-3 text-lg";
  const lbl = "text-xs font-bold text-muted-foreground";
  return (
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-display text-lg font-bold text-primary">{t("collectPayment")} — {stop.clientName}</h2>
        <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit({ amount, paymentMethodId: methodId, received: cash ? received : null, change: cash ? change : null, evidence: stop.evidenceUrls }); }}
        className="flex flex-1 flex-col gap-4 p-4">
        <label className="block space-y-1"><span className={lbl}>{t("amount")}</span>
          <input type="number" step="0.01" min="0" value={amount || ""} onChange={(e) => setAmount(Number(e.target.value))} className={fld} /></label>
        <label className="block space-y-1"><span className={lbl}>{t("paymentMethod")}</span>
          <select required value={methodId} onChange={(e) => setMethodId(e.target.value)} className={fld}><option value="">—</option>{methods.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}</select></label>
        {cash && (
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1"><span className={lbl}>{t("amountReceived")}</span>
              <input type="number" step="0.01" min="0" value={received || ""} onChange={(e) => setReceived(Number(e.target.value))} className={fld} /></label>
            <div><span className={lbl}>{t("changeAmount")}</span><p className="p-3 text-lg font-bold text-primary">{formatCurrency(change)}</p></div>
          </div>
        )}
        <button type="submit" disabled={!methodId} className="mt-auto h-14 w-full rounded-lg bg-primary text-lg font-bold text-primary-foreground disabled:opacity-50">{t("save")}</button>
      </form>
    </ScreenModal>
  );
}
