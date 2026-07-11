import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { supabase } from "@shared/lib/supabase";
import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import { ScreenModal } from "@shared/components/ScreenModal";
import type { AccountReceivable } from "@finance/domain/accounts-receivable.types";

type Cat = { id: string; label: string };

// Cobro de deuda: monto prellenado (fijo = deuda) + método de pago -> collect_pending_debt.
export function AccountsReceivableCollectForm({ item, onClose, onSubmit }: {
  item: AccountReceivable; onClose: () => void; onSubmit: (methodId: string) => void;
}) {
  const { t } = useI18n();
  const [methods, setMethods] = useState<Cat[]>([]);
  const [methodId, setMethodId] = useState("");
  useEffect(() => { void supabase.from("categories").select("id,label").eq("kind", "payment_method").eq("active", true).order("sort").then(({ data }) => setMethods((data as Cat[] | null) ?? [])); }, []);
  const fld = "h-12 w-full rounded-lg border border-border bg-background p-3 text-lg";
  return (
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-display text-lg font-bold text-foreground">{t("collect")} — {item.clientName}</h2>
        <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(methodId); }} className="flex flex-1 flex-col gap-4 p-4">
        <div className="rounded-lg bg-secondary p-3 text-center"><span className="text-xs font-bold text-muted-foreground">{t("amount")}</span>
          <p className="text-2xl font-bold text-foreground">{formatCurrency(item.amount)}</p></div>
        <label className="block space-y-1"><span className="text-xs font-bold text-muted-foreground">{t("paymentMethod")}</span>
          <select required value={methodId} onChange={(e) => setMethodId(e.target.value)} className={fld}><option value="">—</option>{methods.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}</select></label>
        <button type="submit" disabled={!methodId} className="mt-auto h-14 w-full rounded-lg bg-primary text-lg font-bold text-primary-foreground disabled:opacity-50">{t("save")}</button>
      </form>
    </ScreenModal>
  );
}
