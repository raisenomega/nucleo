import { useEffect, useState } from "react";
import { Navigate } from "@tanstack/react-router";
import { useToast } from "@shared/providers/toast-context";
import { useSuperAdmin } from "@shared/hooks/useSuperAdmin";
import { getLeads, setLeadFields, saveLeadEdit, deleteLead, emailLead } from "@raisen-marketing/infrastructure/marketing-leads.repository";
import { getLeadFormConfig } from "@raisen-marketing/infrastructure/marketing-lead-form.repository";
import type { MarketingLead, LeadFormConfig, LeadStatus, LeadTemperature, LeadEditFields } from "@raisen-marketing/data/lead-form.types";
import { LeadFormConfigEditor } from "@raisen-marketing/admin/LeadFormConfigEditor";
import { LeadsStats } from "@raisen-marketing/admin/LeadsStats";
import { LeadsFilters, type LeadFilter } from "@raisen-marketing/admin/LeadsFilters";
import { LeadRow } from "@raisen-marketing/admin/LeadRow";
import { LeadDetailDialog } from "@raisen-marketing/admin/LeadDetailDialog";
import { LeadEditDialog } from "@raisen-marketing/admin/LeadEditDialog";
import { EmailComposeDialog } from "@raisen-marketing/admin/EmailComposeDialog";

const EMPTY_F: LeadFilter = { search: "", status: "", temperature: "", leadType: "", showArchived: false };

// Inbox /web/leads (CRM): config del form + métricas + filtros + tabla con status/temp inline + dialogs
// (ver/editar/email/WhatsApp). Carga todos (superadmin) y filtra en cliente. Escritura solo superadmin (RLS).
export function LeadsInbox() {
  const { isSuperAdmin } = useSuperAdmin();
  const toast = useToast();
  const [config, setConfig] = useState<LeadFormConfig | null>(null);
  const [leads, setLeads] = useState<MarketingLead[]>([]);
  const [f, setF] = useState<LeadFilter>(EMPTY_F);
  const [dlg, setDlg] = useState<{ kind: "view" | "edit" | "email"; lead: MarketingLead } | null>(null);
  const reload = () => { void getLeads().then(setLeads); };
  useEffect(() => { void getLeadFormConfig().then(setConfig); reload(); }, []);
  if (!isSuperAdmin) return <Navigate to="/dashboard" />;
  const done = (e: string | null) => { if (e) toast.error(e); else reload(); };
  const shown = leads.filter((l) => {
    if (!f.showArchived && f.status !== "archived" && l.status === "archived") return false;
    if (f.status && l.status !== f.status) return false;
    if (f.temperature && l.temperature !== f.temperature) return false;
    if (f.leadType && l.leadType !== f.leadType) return false;
    if (f.search) { const q = f.search.toLowerCase(); return [l.customerName, l.customerEmail, l.company].some((x) => (x ?? "").toLowerCase().includes(q)); }
    return true;
  });
  const saveDetail = async (id: string, p: { status: LeadStatus; temperature: LeadTemperature; notes: string }) => { const e = await setLeadFields(id, p); if (e) return toast.error(e); setDlg(null); toast.success("Guardado"); reload(); };
  const saveEdit = async (id: string, ef: LeadEditFields) => { const e = await saveLeadEdit(id, ef); if (e) return toast.error(e); setDlg(null); toast.success("Guardado"); reload(); };
  return (
    <div className="max-w-4xl space-y-5 p-4 md:p-8">
      <h1 className="font-display text-2xl font-bold text-foreground">Inbox · Leads comercial (CRM)</h1>
      {config && <LeadFormConfigEditor config={config} />}
      <LeadsStats leads={leads} />
      <LeadsFilters f={f} set={(p) => setF((x) => ({ ...x, ...p }))} />
      <div className="space-y-2">
        {shown.length === 0 && <p className="text-sm text-muted-foreground">Sin leads en esta vista.</p>}
        {shown.map((l) => (
          <LeadRow key={l.id} lead={l}
            onStatus={(s) => void setLeadFields(l.id, { status: s }).then(done)}
            onTemp={(t) => void setLeadFields(l.id, { temperature: t }).then(done)}
            onView={() => setDlg({ kind: "view", lead: l })} onEdit={() => setDlg({ kind: "edit", lead: l })} onEmail={() => setDlg({ kind: "email", lead: l })}
            onDelete={() => { if (window.confirm(`¿Eliminar el lead de "${l.customerName}"?`)) void deleteLead(l.id).then(done); }} />
        ))}
      </div>
      {dlg?.kind === "view" && <LeadDetailDialog lead={dlg.lead} onClose={() => setDlg(null)} onSave={(p) => saveDetail(dlg.lead.id, p)} />}
      {dlg?.kind === "edit" && <LeadEditDialog lead={dlg.lead} onClose={() => setDlg(null)} onSave={(ef) => saveEdit(dlg.lead.id, ef)} />}
      {dlg?.kind === "email" && <EmailComposeDialog toName={dlg.lead.customerName} toEmail={dlg.lead.customerEmail} defaultSubject="NÚCLEO — seguimiento de tu solicitud" onClose={() => setDlg(null)} onSend={(s, b, cc, bcc) => emailLead(dlg.lead.id, s, b, cc, bcc)} />}
    </div>
  );
}
