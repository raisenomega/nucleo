import { useMemo, useState } from "react";
import { Plus, FileInput } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useSession } from "@shared/providers/SessionProvider";
import { useVendorBills } from "@accounting/application/useVendorBills.hook";
import { vendorBillRepository } from "@accounting/infrastructure/supabase-vendor-bill.repository";
import { VendorBillsTable } from "@accounting/presentation/VendorBillsTable";
import { ApAgingTable } from "@accounting/presentation/ApAgingTable";
import { VendorBillDetail } from "@accounting/presentation/VendorBillDetail";
import { VendorBillFormModal } from "@accounting/presentation/VendorBillFormModal";
import { CreateFromPoModal } from "@accounting/presentation/CreateFromPoModal";
import { BillPaymentModal } from "@accounting/presentation/BillPaymentModal";
import { BILL_STATUSES, BILL_STATUS_META } from "@accounting/presentation/vendor-bill-ui";

export function VendorBillsPage() {
  const { t } = useI18n();
  const { session } = useSession();
  const isCeo = session?.role === "ceo" || session?.role === "superadmin";
  const v = useVendorBills(vendorBillRepository);
  const [view, setView] = useState<"bills" | "aging">("bills");
  const [status, setStatus] = useState(""); const [search, setSearch] = useState("");
  const [modal, setModal] = useState<null | "form" | "fromPo" | "pay">(null);
  const sel = v.selected;
  const q = search.toLowerCase();
  const filtered = useMemo(() => v.bills.filter((b) => (!status || b.status === status) &&
    (!q || b.supplierName.toLowerCase().includes(q) || b.internalNumber.toLowerCase().includes(q) || b.billNumber.toLowerCase().includes(q))), [v.bills, status, q]);
  const tab = (id: "bills" | "aging", label: string) => <button type="button" onClick={() => setView(id)} className={`px-3 py-1.5 text-sm font-bold ${view === id ? "border-b-2 border-foreground text-foreground" : "text-muted-foreground"}`}>{label}</button>;
  const inp = "rounded-lg border border-border bg-background p-2 text-sm";
  return (
    <div className="space-y-4 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-bold text-foreground md:text-3xl">{t("accountsPayable")}</h1>
        {isCeo && <div className="flex gap-2">
          <button type="button" onClick={() => setModal("fromPo")} className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-2 text-sm font-bold"><FileInput className="h-4 w-4" />{t("fromPurchaseOrder")}</button>
          <button type="button" onClick={() => setModal("form")} className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground"><Plus className="h-4 w-4" />{t("createBill")}</button>
        </div>}
      </div>
      <div className="flex gap-2 border-b border-border">{tab("bills", t("vendorBills"))}{tab("aging", t("apAging"))}</div>
      {view === "bills" && <div className="flex flex-wrap gap-2">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={inp}><option value="">{t("allStatuses")}</option>{BILL_STATUSES.map((s) => <option key={s} value={s}>{t(BILL_STATUS_META[s].key)}</option>)}</select>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("search")} className={`${inp} flex-1`} />
      </div>}
      {v.loading ? <p className="text-sm text-muted-foreground">…</p>
        : view === "bills" ? <VendorBillsTable bills={filtered} onSelect={(id) => void v.select(id)} />
        : <ApAgingTable bills={v.bills} onSupplier={(id) => { setView("bills"); setSearch(v.bills.find((b) => b.supplierId === id)?.supplierName ?? ""); }} />}
      {sel && <VendorBillDetail bill={sel} canEdit={isCeo} onApprove={() => void v.approve(sel.id)} onPayClick={() => setModal("pay")}
        onVoidBill={() => { if (window.confirm(`${t("voidBill")}?`)) void v.voidBill(sel.id); }}
        onVoidPayment={(pid) => void v.voidPayment(sel.id, pid, "Anulado")} onClose={() => void v.select(null)} />}
      {modal === "form" && <VendorBillFormModal onCreate={v.create} onClose={() => setModal(null)} />}
      {modal === "fromPo" && <CreateFromPoModal onCreate={v.createFromPo} onClose={() => setModal(null)} />}
      {modal === "pay" && sel && <BillPaymentModal bill={sel} onClose={() => setModal(null)} onPay={(amt, date, m, ref, notes) => v.recordPayment(sel.id, amt, date, m, ref, notes)} />}
    </div>
  );
}
