import { Archive, Copy, Pencil, Receipt, FileText, FileDown } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { usePdf } from "@shared/hooks/usePdf";
import { supabaseInvoiceRepository } from "@billing/infrastructure/supabase-invoice.repository";
import { supabaseQuoteRepository } from "@quotes/infrastructure/supabase-quote.repository";

// Acciones del header del detalle, gateadas por module_access (leads). Cotizar/Factura generan docs reales desde los items.
export function LeadDetailActions({ leadId, onEdit, onDuplicate, onArchive }: {
  leadId: string; onEdit: () => void; onDuplicate: () => void; onArchive: () => void;
}) {
  const { t } = useI18n();
  const { can } = useModuleAccess();
  const nav = useNavigate();
  const pdf = usePdf();
  const edit = can("leads", "edit"), create = can("leads", "create"), docs = can("leads", "documents");
  async function quote() {
    const id = await supabaseQuoteRepository.fromLead(leadId);
    if (id) void nav({ to: "/quotes" }); else window.alert(t("requiredFields"));
  }
  async function invoice() {
    const id = await supabaseInvoiceRepository.fromLead(leadId);
    if (id) void nav({ to: "/billing" }); else window.alert(t("requiredFields"));
  }
  const b = "flex items-center gap-1 rounded-lg bg-secondary px-2 py-1 text-xs font-body hover:bg-primary hover:text-primary-foreground";
  return (
    <div className="flex flex-wrap gap-2">
      {edit && <button type="button" onClick={onEdit} className={b}><Pencil className="h-3 w-3" /> {t("edit")}</button>}
      {create && <button type="button" onClick={onDuplicate} className={b}><Copy className="h-3 w-3" /> {t("duplicate")}</button>}
      {edit && <button type="button" onClick={onArchive} className={b}><Archive className="h-3 w-3" /> {t("archive")}</button>}
      {docs && <button type="button" onClick={() => void quote()} className={b}><FileText className="h-3 w-3" /> {t("quote")}</button>}
      {docs && <button type="button" onClick={() => void invoice()} className={b}><Receipt className="h-3 w-3" /> {t("invoice")}</button>}
      {docs && <button type="button" disabled={pdf.generating} onClick={() => void pdf.generatePdf("lead", leadId)} className={`${b} disabled:opacity-50`}><FileDown className="h-3 w-3" /> {pdf.generating ? t("generatingPdf") : "PDF"}</button>}
    </div>
  );
}
