import { Archive, Copy, Pencil, Receipt, FileText, FileDown } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { usePdfExport } from "@shared/hooks/usePdfExport";
import { usePdfBrand } from "@shared/hooks/usePdfBrand";
import { leadDoc } from "@crm/presentation/pdf/lead-pdf";
import { supabaseInvoiceRepository } from "@billing/infrastructure/supabase-invoice.repository";
import { supabaseQuoteRepository } from "@quotes/infrastructure/supabase-quote.repository";
import type { Lead } from "@crm/domain/lead.types";

// Acciones del header del detalle, gateadas por module_access (leads). Cotizar/Factura generan docs reales desde los items.
export function LeadDetailActions({ lead, onEdit, onDuplicate, onArchive }: {
  lead: Lead; onEdit: () => void; onDuplicate: () => void; onArchive: () => void;
}) {
  const { t } = useI18n();
  const { can } = useModuleAccess();
  const nav = useNavigate();
  const { generating, exportPdf } = usePdfExport();
  const brand = usePdfBrand();
  const edit = can("leads", "edit"), create = can("leads", "create"), docs = can("leads", "documents");
  // El servidor ya explica por que no pudo ("Lead no encontrado", "No autorizado"). Antes se tapaba con
  // "campos requeridos", que culpaba al usuario de un fallo que no era suyo (auditoria E2E §13).
  async function quote() {
    const r = await supabaseQuoteRepository.fromLead(lead.id);
    if (r.ok) void nav({ to: "/quotes" }); else window.alert(r.error);
  }
  async function invoice() {
    const r = await supabaseInvoiceRepository.fromLead(lead.id);
    if (r.ok) void nav({ to: "/billing" }); else window.alert(r.error);
  }
  const b = "flex items-center gap-1 rounded-lg bg-secondary px-2 py-1 text-xs font-body hover:bg-primary hover:text-primary-foreground";
  return (
    <div className="flex flex-wrap gap-2">
      {edit && <button type="button" onClick={onEdit} className={b}><Pencil className="h-3 w-3" /> {t("edit")}</button>}
      {create && <button type="button" onClick={onDuplicate} className={b}><Copy className="h-3 w-3" /> {t("duplicate")}</button>}
      {edit && <button type="button" onClick={onArchive} className={b}><Archive className="h-3 w-3" /> {t("archive")}</button>}
      {docs && <button type="button" onClick={() => void quote()} className={b}><FileText className="h-3 w-3" /> {t("quote")}</button>}
      {docs && <button type="button" onClick={() => void invoice()} className={b}><Receipt className="h-3 w-3" /> {t("invoice")}</button>}
      {docs && <button type="button" disabled={generating} onClick={() => void exportPdf(() => leadDoc(lead, brand, t))} className={`${b} disabled:opacity-50`}><FileDown className="h-3 w-3" /> {generating ? t("generatingPdf") : "PDF"}</button>}
    </div>
  );
}
