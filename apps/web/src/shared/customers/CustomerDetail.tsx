import { useEffect, useState } from "react";
import { X, CalendarPlus } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import { loadDossier, type Dossier } from "@shared/customers/customer-dossier";
import { CustomerProfileCard } from "@shared/customers/CustomerProfileCard";
import { CustomerCommercial } from "@shared/customers/CustomerCommercial";
import { CustomerStatement } from "@shared/customers/CustomerStatement";
import { CustomerSatellites } from "@shared/customers/CustomerSatellites";
import { CustomerDossierView } from "@shared/customers/CustomerDossierView";
import { CustomerReviewsAdmin } from "@shared/customers/CustomerReviewsAdmin";
import type { CustomerSegment } from "@shared/customers/customer-segments.repository";
import type { AdminCustomer } from "@shared/customers/customers-agg";

const EMPTY: Dossier = { orders: [], invoices: [], services: [], tickets: [], reviews: [], leads: [] };

// Detalle CRM del cliente: perfil + comercial (segmento/descuento/bloqueo) + dossier + evaluaciones.
export function CustomerDetail({ c, tenantId, segments, onClose, onChanged }: { c: AdminCustomer; tenantId: string; segments: CustomerSegment[]; onClose: () => void; onChanged: () => void }) {
  const { t } = useI18n();
  const [d, setD] = useState<Dossier>(EMPTY);
  const load = () => { void loadDossier(tenantId, c.email, c.phone, c.userId, c.id).then(setD); };
  useEffect(load, [c.id, tenantId]);
  return (
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4 md:p-6">
        <h2 className="font-display text-lg font-bold text-foreground">{c.fullName || c.email}</h2>
        <div className="flex items-center gap-3">
          <Link to="/routes" search={{ customer: c.id, cname: c.fullName, cphone: c.phone, caddr: c.address }}
            className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"><CalendarPlus className="h-4 w-4" />Agendar servicio</Link>
          <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
        </div>
      </div>
      <div className="space-y-3 p-4 md:p-6">
        <CustomerProfileCard c={c} onChanged={onChanged} />
        <CustomerCommercial c={c} segments={segments} onChanged={onChanged} />
        <CustomerStatement customerId={c.id} />
        <CustomerSatellites customerId={c.id} />
        <CustomerDossierView d={d} />
        <CustomerReviewsAdmin reviews={d.reviews} onChanged={load} />
      </div>
    </ScreenModal>
  );
}
