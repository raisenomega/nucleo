import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { supabase } from "@shared/lib/supabase";
import { useI18n } from "@shared/i18n";
import { useLead } from "@crm/application/useLead.hook";
import { supabaseLeadRepository } from "@crm/infrastructure/supabase-lead.repository";
import { LeadForm } from "@crm/presentation/LeadForm";
import { LeadTable } from "@crm/presentation/LeadTable";
import { LeadDetail } from "@crm/presentation/LeadDetail";
import type { Lead, LeadFormData } from "@crm/domain/lead.types";

export const Route = createFileRoute("/_authenticated/leads")({ component: LeadsPage });

type Cat = { id: string; label: string; kind: string };

function toForm(l: Lead): LeadFormData {
  return { contactName: l.contactName, phone: l.phone, email: l.email, address: l.address, city: l.city,
    zipCode: l.zipCode, leadSourceId: l.leadSourceId, serviceTypeId: l.serviceTypeId, temperature: l.temperature,
    status: l.status, callDate: l.callDate, notes: l.notes, quotedPrice: l.quotedPrice, items: l.items,
    evidenceUrls: l.evidenceUrls };
}

function LeadsPage() {
  const { t } = useI18n();
  const { leads, create, update, remove } = useLead(supabaseLeadRepository);
  const [cats, setCats] = useState<Cat[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [viewing, setViewing] = useState<string | null>(null);

  useEffect(() => {
    void supabase.from("categories").select("id,label,kind").in("kind", ["lead_source", "service_type"])
      .then(({ data }) => setCats((data as Cat[] | null) ?? []));
  }, []);

  const editRow = useMemo(() => {
    const l = leads.find((x) => x.id === editing);
    return l ? toForm(l) : undefined;
  }, [editing, leads]);

  async function submit(d: LeadFormData) {
    if (editing && editing !== "new") await update(editing, d); else await create(d);
    setEditing(null);
  }

  const viewLead = leads.find((l) => l.id === viewing);
  return (
    <div className="space-y-6 p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary">{t("leads")}</h1>
          <p className="text-xs text-muted-foreground">{t("leadSubtitle")}</p>
        </div>
        <button type="button" onClick={() => setEditing("new")}
          className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 font-body font-bold">
          <Plus className="h-4 w-4" /> {t("newLead")}
        </button>
      </div>
      {editing !== null && (
        <LeadForm sources={cats.filter((c) => c.kind === "lead_source")} services={cats.filter((c) => c.kind === "service_type")}
          initial={editRow} onSubmit={submit} onCancel={() => setEditing(null)} />
      )}
      <LeadTable rows={leads} onView={setViewing} onEdit={setEditing}
        onDelete={(id) => { if (window.confirm(`${t("delete")}?`)) void remove(id); }} />
      {viewLead && (
        <LeadDetail lead={viewLead} onClose={() => setViewing(null)}
          onEdit={() => { setEditing(viewLead.id); setViewing(null); }}
          onDuplicate={() => { void create(toForm(viewLead)); setViewing(null); }}
          onArchive={() => { void update(viewLead.id, { ...toForm(viewLead), status: "lost" }); setViewing(null); }} />
      )}
    </div>
  );
}
