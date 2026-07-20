import { useState } from "react";
import { LEAD_STATUSES, STATUS_LABELS, TEMPERATURES, TEMP_LABELS } from "@raisen-marketing/admin/lead-constants";
import type { MarketingLead, LeadStatus, LeadTemperature } from "@raisen-marketing/data/lead-form.types";

const F = "w-full rounded-lg border border-border bg-background p-2 text-sm text-foreground";
const Field = ({ k, v }: { k: string; v: string | null }) => v ? <p className="text-sm text-foreground"><span className="text-muted-foreground">{k}:</span> {v}</p> : null;

// Detalle del lead: todos los campos (empresa/UTMs/source/etc.) + cambiar status + temperatura + notas → Guardar.
export function LeadDetailDialog({ lead, onClose, onSave }: { lead: MarketingLead; onClose: () => void; onSave: (patch: { status: LeadStatus; temperature: LeadTemperature; notes: string }) => void }) {
  const [status, setStatus] = useState<LeadStatus>(lead.status);
  const [temperature, setTemp] = useState<LeadTemperature>(lead.temperature);
  const [notes, setNotes] = useState(lead.notes ?? "");
  const utm = [lead.utmSource, lead.utmMedium, lead.utmCampaign].filter(Boolean).join(" / ");
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-lg space-y-3 overflow-y-auto rounded-xl border border-border bg-card p-5" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-lg font-bold text-foreground">{lead.customerName}</h2>
        <div className="space-y-1">
          <Field k="Email" v={lead.customerEmail} />
          <Field k="Teléfono" v={lead.customerPhone} />
          <Field k="WhatsApp" v={lead.whatsappPhone} />
          <Field k="Empresa" v={lead.company} />
          <Field k="Tipo" v={lead.leadType === "business" ? "Para su negocio" : "Partner"} />
          <Field k="Rubro" v={lead.businessType} />
          <Field k="Mensaje" v={lead.message} />
          <Field k="UTM" v={utm || null} />
          <Field k="Origen" v={lead.sourceUrl} />
          <Field k="Fecha" v={lead.createdAt.replace("T", " ").slice(0, 16)} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-sm text-muted-foreground">Status<select value={status} onChange={(e) => setStatus(e.target.value as LeadStatus)} className={F}>{LEAD_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</select></label>
          <label className="text-sm text-muted-foreground">Temperatura<select value={temperature} onChange={(e) => setTemp(e.target.value as LeadTemperature)} className={F}>{TEMPERATURES.map((t) => <option key={t} value={t}>{TEMP_LABELS[t]}</option>)}</select></label>
        </div>
        <label className="block text-sm text-muted-foreground">Notas internas<textarea rows={3} className={F} value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
        <div className="flex gap-2">
          <button type="button" onClick={() => onSave({ status, temperature, notes })} className="flex-1 rounded-lg bg-primary py-2 text-sm font-bold text-primary-foreground">Guardar</button>
          <button type="button" onClick={onClose} className="rounded-lg bg-secondary px-4 py-2 text-sm text-foreground">Cerrar</button>
        </div>
      </div>
    </div>
  );
}
