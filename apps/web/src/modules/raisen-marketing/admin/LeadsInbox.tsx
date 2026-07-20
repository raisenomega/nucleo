import { useEffect, useState } from "react";
import { Navigate } from "@tanstack/react-router";
import { useToast } from "@shared/providers/toast-context";
import { useSuperAdmin } from "@shared/hooks/useSuperAdmin";
import { getLeads, setLeadFields, deleteLead } from "@raisen-marketing/infrastructure/marketing-leads.repository";
import { getLeadFormConfig } from "@raisen-marketing/infrastructure/marketing-lead-form.repository";
import type { MarketingLead, LeadFormConfig, LeadStatus } from "@raisen-marketing/data/lead-form.types";
import { LEAD_STATUSES, STATUS_LABELS } from "@raisen-marketing/admin/lead-constants";
import { LeadRow } from "@raisen-marketing/admin/LeadRow";
import { LeadDetailDialog } from "@raisen-marketing/admin/LeadDetailDialog";
import { LeadFormConfigEditor } from "@raisen-marketing/admin/LeadFormConfigEditor";

const SEL = "rounded-lg border border-border bg-background p-2 text-sm text-foreground";

// Inbox /web/leads (Super Admin): editor de textos del form + tabla de leads reales (filtros status/tipo,
// cambio de status inline, detalle con notas, eliminar). Default oculta archivados. Escritura solo superadmin (RLS).
export function LeadsInbox() {
  const { isSuperAdmin } = useSuperAdmin();
  const toast = useToast();
  const [config, setConfig] = useState<LeadFormConfig | null>(null);
  const [leads, setLeads] = useState<MarketingLead[]>([]);
  const [f, setF] = useState<{ status: string; leadType: string }>({ status: "", leadType: "" });
  const [view, setView] = useState<MarketingLead | null>(null);
  const reload = (nf = f) => { void getLeads(nf).then(setLeads); };
  useEffect(() => { void getLeadFormConfig().then(setConfig); reload(); }, []);
  if (!isSuperAdmin) return <Navigate to="/dashboard" />;
  const done = (e: string | null) => { if (e) toast.error(e); else reload(); };
  const setFilter = (p: Partial<typeof f>) => { const nf = { ...f, ...p }; setF(nf); reload(nf); };
  const saveDetail = async (patch: { status: LeadStatus; notes: string }) => { const e = await setLeadFields(view!.id, patch); if (e) return toast.error(e); setView(null); toast.success("Guardado"); reload(); };
  return (
    <div className="space-y-6 p-4 md:p-8">
      <h1 className="font-display text-2xl font-bold text-foreground">Inbox · Leads comercial</h1>
      {config && <LeadFormConfigEditor config={config} />}
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-display text-lg font-bold text-foreground">Leads ({leads.length})</h2>
        <select value={f.status} onChange={(e) => setFilter({ status: e.target.value })} className={SEL}><option value="">Activos</option>{LEAD_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</select>
        <select value={f.leadType} onChange={(e) => setFilter({ leadType: e.target.value })} className={SEL}><option value="">Todos</option><option value="business">Negocio</option><option value="partner">Partner</option></select>
      </div>
      <div className="space-y-2">
        {leads.length === 0 && <p className="text-sm text-muted-foreground">Sin leads en esta vista.</p>}
        {leads.map((l) => (
          <LeadRow key={l.id} lead={l} onStatus={(s) => void setLeadFields(l.id, { status: s }).then(done)}
            onView={() => setView(l)}
            onDelete={() => { if (window.confirm(`¿Eliminar el lead de "${l.customerName}"?`)) void deleteLead(l.id).then(done); }} />
        ))}
      </div>
      {view && <LeadDetailDialog lead={view} onClose={() => setView(null)} onSave={saveDetail} />}
    </div>
  );
}
