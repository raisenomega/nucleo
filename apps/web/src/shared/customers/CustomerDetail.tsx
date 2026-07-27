import { useEffect, useState } from "react";
import { X, CalendarPlus, FileDown, MessageCircle } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import { usePdfExport } from "@shared/hooks/usePdfExport";
import { usePdfShare } from "@shared/hooks/usePdfShare";
import { usePdfBrand } from "@shared/hooks/usePdfBrand";
import { customerDoc } from "@shared/customers/customer-pdf";
import { ScreenModal } from "@shared/components/ScreenModal";
import { loadDossier, type Dossier } from "@shared/customers/customer-dossier";
import { CustomerProfileCard } from "@shared/customers/CustomerProfileCard";
import { CustomerCommercial } from "@shared/customers/CustomerCommercial";
import { CustomerStatement } from "@shared/customers/CustomerStatement";
import { CustomerPayments } from "@shared/customers/CustomerPayments";
import { CustomerOrders } from "@shared/customers/CustomerOrders";
import { CustomerTimeline } from "@shared/customers/CustomerTimeline";
import { CustomerSatellites } from "@shared/customers/CustomerSatellites";
import { CustomerDossierView } from "@shared/customers/CustomerDossierView";
import { CustomerReviewsAdmin } from "@shared/customers/CustomerReviewsAdmin";
import type { CustomerSegment } from "@shared/customers/customer-segments.repository";
import type { AdminCustomer } from "@shared/customers/customers-agg";

const EMPTY: Dossier = { invoices: [], quotes: [], services: [], tickets: [], reviews: [], leads: [] };

// Detalle CRM del cliente: perfil + comercial (segmento/descuento/bloqueo) + dossier + evaluaciones.
export function CustomerDetail({ c, tenantId, segments, onClose, onChanged }: { c: AdminCustomer; tenantId: string; segments: CustomerSegment[]; onClose: () => void; onChanged: () => void }) {
  const { t } = useI18n();
  const { generating, exportPdf } = usePdfExport();
  const { sharing, sharePdf } = usePdfShare();
  const brand = usePdfBrand();
  const [tab, setTab] = useState<"summary" | "activity">("summary");
  const [d, setD] = useState<Dossier>(EMPTY);
  const load = () => { void loadDossier(tenantId, c.email, c.phone, c.userId, c.id).then(setD); };
  useEffect(load, [c.id, tenantId]);
  async function waSend() {
    const url = await sharePdf(() => customerDoc(c, tenantId, brand, t), `customer/${c.id}-${Date.now()}.pdf`);
    window.open(`https://wa.me/${(c.phone ?? "").replace(/\D/g, "")}?text=${encodeURIComponent(`${t("docCustomer")}${url ? `\n${url}` : ""}`)}`, "_blank", "noopener");
  }
  return (
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4 md:p-6">
        <h2 className="font-display text-lg font-bold text-foreground">{c.fullName || c.email}</h2>
        <div className="flex items-center gap-2">
          <button type="button" disabled={generating} onClick={() => void exportPdf(() => customerDoc(c, tenantId, brand, t))} className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-1.5 text-xs font-bold disabled:opacity-50"><FileDown className="h-4 w-4" />PDF</button>
          {c.phone && <button type="button" disabled={sharing} onClick={() => void waSend()} className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"><MessageCircle className="h-4 w-4" />{sharing ? t("generatingPdf") : t("whatsapp")}</button>}
          <Link to="/routes" search={{ customer: c.id, cname: c.fullName, cphone: c.phone, caddr: c.address }}
            className="hidden items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground sm:flex"><CalendarPlus className="h-4 w-4" />Agendar servicio</Link>
          <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
        </div>
      </div>
      <div className="flex gap-1 border-b border-border px-4 md:px-6">
        {(["summary", "activity"] as const).map((k) => (
          <button key={k} type="button" onClick={() => setTab(k)}
            className={`px-3 py-2 text-sm font-bold ${tab === k ? "border-b-2 border-foreground text-foreground" : "text-muted-foreground"}`}>{k === "summary" ? "Resumen" : "Actividad"}</button>))}
      </div>
      {tab === "activity" ? <div className="p-4 md:p-6"><CustomerTimeline customerId={c.id} /></div> : (
        <div className="space-y-3 p-4 md:p-6">
          <CustomerProfileCard c={c} onChanged={onChanged} />
          <CustomerCommercial c={c} segments={segments} onChanged={onChanged} />
          <CustomerStatement customerId={c.id} />
          <CustomerPayments tenantId={tenantId} customerId={c.id} email={c.email} />
          <CustomerOrders tenantId={tenantId} customerId={c.id} email={c.email} />
          <CustomerSatellites customerId={c.id} />
          <CustomerDossierView d={d} />
          <CustomerReviewsAdmin reviews={d.reviews} onChanged={load} />
        </div>)}
    </ScreenModal>
  );
}
