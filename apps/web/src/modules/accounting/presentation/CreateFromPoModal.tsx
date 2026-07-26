import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import { ScreenModal } from "@shared/components/ScreenModal";
import { useToast } from "@shared/providers/toast-context";
import { fetchReceivablePos, type PoRef } from "@accounting/infrastructure/ap-refs";
import type { Result } from "@accounting/domain/chart-of-accounts.types";

type FromPo = (poId: string, num: string, bd: string, dd: string) => Promise<Result<string, string>>;

// Crear bill desde una orden de compra recibida/parcial. Las líneas las arma el backend desde received_qty×unit_cost.
export function CreateFromPoModal({ onCreate, onClose }: { onCreate: FromPo; onClose: () => void }) {
  const { t } = useI18n(); const toast = useToast();
  const [pos, setPos] = useState<PoRef[]>([]);
  const [poId, setPoId] = useState(""); const [billNumber, setBillNumber] = useState("");
  const [billDate, setBillDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().slice(0, 10));
  useEffect(() => { void fetchReceivablePos().then(setPos); }, []);
  const po = useMemo(() => pos.find((p) => p.id === poId), [pos, poId]);
  const valid = !!poId && billNumber.trim() !== "" && dueDate >= billDate;
  async function save() { const r = await onCreate(poId, billNumber.trim(), billDate, dueDate); if (r.ok) { toast.success(t("saved")); onClose(); } else toast.error(r.error); }
  const f = "w-full rounded border border-border bg-background p-2 text-sm";
  return (
    <ScreenModal onClose={onClose}>
      <div className="space-y-3 p-4 md:p-6">
        <h2 className="font-display text-lg font-bold text-foreground">{t("fromPurchaseOrder")}</h2>
        <select value={poId} onChange={(e) => setPoId(e.target.value)} className={f}><option value="">{t("selectPo")}</option>{pos.map((p) => <option key={p.id} value={p.id}>PO-{p.orderNumber} · {p.supplierName} · {formatCurrency(p.total)}</option>)}</select>
        {po && <p className="text-xs text-muted-foreground">{t("prefilledFromPo")}: {po.supplierName} · {formatCurrency(po.total)}</p>}
        <input value={billNumber} onChange={(e) => setBillNumber(e.target.value)} placeholder={t("billNumber")} className={f} />
        <div className="flex gap-2"><input type="date" value={billDate} onChange={(e) => setBillDate(e.target.value)} className={f} /><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={f} /></div>
        <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg bg-secondary px-4 py-2 text-sm font-bold">{t("cancelBtn")}</button>
          <button type="button" disabled={!valid} onClick={() => void save()} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">{t("saveBtn")}</button></div>
      </div>
    </ScreenModal>
  );
}
