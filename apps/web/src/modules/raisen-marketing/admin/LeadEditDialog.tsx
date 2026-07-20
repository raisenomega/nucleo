import { useState } from "react";
import type { MarketingLead, LeadEditFields } from "@raisen-marketing/data/lead-form.types";

const F = "w-full rounded-lg border border-border bg-background p-2 text-sm text-foreground";

// Editar los datos del lead (nombre/email/teléfono/empresa/WhatsApp). Guarda vía UPDATE (RLS superadmin).
export function LeadEditDialog({ lead, onClose, onSave }: { lead: MarketingLead; onClose: () => void; onSave: (f: LeadEditFields) => void }) {
  const [f, setF] = useState<LeadEditFields>({ customerName: lead.customerName, customerEmail: lead.customerEmail, customerPhone: lead.customerPhone ?? "", company: lead.company ?? "", whatsappPhone: lead.whatsappPhone ?? "" });
  const set = (p: Partial<LeadEditFields>) => setF((x) => ({ ...x, ...p }));
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md space-y-3 rounded-xl border border-border bg-card p-5" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-lg font-bold text-foreground">Editar lead</h2>
        <input className={F} placeholder="Nombre" value={f.customerName} onChange={(e) => set({ customerName: e.target.value })} />
        <input className={F} placeholder="Email" value={f.customerEmail} onChange={(e) => set({ customerEmail: e.target.value })} />
        <div className="grid grid-cols-2 gap-2">
          <input className={F} placeholder="Teléfono" value={f.customerPhone} onChange={(e) => set({ customerPhone: e.target.value })} />
          <input className={F} placeholder="WhatsApp" value={f.whatsappPhone} onChange={(e) => set({ whatsappPhone: e.target.value })} />
        </div>
        <input className={F} placeholder="Empresa" value={f.company} onChange={(e) => set({ company: e.target.value })} />
        <div className="flex gap-2">
          <button type="button" onClick={() => onSave(f)} className="flex-1 rounded-lg bg-primary py-2 text-sm font-bold text-primary-foreground">Guardar</button>
          <button type="button" onClick={onClose} className="rounded-lg bg-secondary px-4 py-2 text-sm text-foreground">Cancelar</button>
        </div>
      </div>
    </div>
  );
}
