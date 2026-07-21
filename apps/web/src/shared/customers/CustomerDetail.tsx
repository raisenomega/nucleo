import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import { loadDossier, type Dossier } from "@shared/customers/customer-dossier";
import { CustomerProfileCard } from "@shared/customers/CustomerProfileCard";
import { CustomerSatellites } from "@shared/customers/CustomerSatellites";
import { CustomerDossierView } from "@shared/customers/CustomerDossierView";
import { CustomerReviewsAdmin } from "@shared/customers/CustomerReviewsAdmin";
import type { AdminCustomer } from "@shared/customers/customers-agg";

const EMPTY: Dossier = { orders: [], invoices: [], services: [], tickets: [], reviews: [] };

// Detalle CRM del cliente: perfil + acciones + dossier (órdenes/facturas/servicios/tickets) + evaluaciones.
export function CustomerDetail({ c, tenantId, onClose, onChanged }: { c: AdminCustomer; tenantId: string; onClose: () => void; onChanged: () => void }) {
  const { t } = useI18n();
  const [d, setD] = useState<Dossier>(EMPTY);
  const load = () => { void loadDossier(tenantId, c.email, c.phone, c.userId, c.id).then(setD); };
  useEffect(load, [c.id, tenantId]);
  return (
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4 md:p-6">
        <h2 className="font-display text-lg font-bold text-foreground">{c.fullName || c.email}</h2>
        <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
      </div>
      <div className="space-y-3 p-4 md:p-6">
        <CustomerProfileCard c={c} onChanged={onChanged} />
        <CustomerSatellites customerId={c.id} />
        <CustomerDossierView d={d} />
        <CustomerReviewsAdmin reviews={d.reviews} onChanged={load} />
      </div>
    </ScreenModal>
  );
}
