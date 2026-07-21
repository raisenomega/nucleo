import { useState } from "react";
import type { AdminCustomer } from "@shared/customers/customers-agg";
import type { CustomerPayload } from "@shared/customers/customer-crm.repository";

type Draft = { full_name: string; display_name: string; email: string; phone: string; company_name: string;
  tax_id: string; customer_type: string; credit_limit: string; payment_terms: string; payment_terms_custom_days: string; notes_for_team: string };
const F = "w-full rounded-lg border border-border bg-background p-2 text-sm text-foreground";
const from = (c: AdminCustomer | null): Draft => ({ full_name: c?.fullName ?? "", display_name: c?.displayName ?? "", email: c?.email ?? "",
  phone: c?.phone ?? "", company_name: c?.companyName ?? "", tax_id: c?.taxId ?? "", customer_type: c?.customerType ?? "individual",
  credit_limit: c ? String(c.creditLimit) : "0", payment_terms: c?.paymentTerms ?? "immediate", payment_terms_custom_days: "", notes_for_team: c?.notesForTeam ?? "" });

// Alta/edición manual de un cliente del maestro. Crea clientes SIN cuenta de portal (user_id null, source manual).
export function CustomerFormDialog({ initial, onClose, onSave }: { initial: AdminCustomer | null; onClose: () => void; onSave: (id: string | undefined, p: CustomerPayload) => void }) {
  const [d, setD] = useState<Draft>(from(initial));
  const set = (p: Partial<Draft>) => setD((x) => ({ ...x, ...p }));
  const submit = () => onSave(initial?.id, { ...d, credit_limit: Number(d.credit_limit) || 0,
    payment_terms_custom_days: d.payment_terms_custom_days ? Number(d.payment_terms_custom_days) : null } as CustomerPayload);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-lg space-y-3 overflow-y-auto rounded-xl border border-border bg-card p-5" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-lg font-bold text-foreground">{initial ? "Editar" : "Nuevo"} cliente</h2>
        <input className={F} placeholder="Nombre *" value={d.full_name} onChange={(e) => set({ full_name: e.target.value })} />
        <div className="grid grid-cols-2 gap-2">
          <input className={F} placeholder="Email" value={d.email} onChange={(e) => set({ email: e.target.value })} />
          <input className={F} placeholder="Teléfono" value={d.phone} onChange={(e) => set({ phone: e.target.value })} />
          <select className={F} value={d.customer_type} onChange={(e) => set({ customer_type: e.target.value })}><option value="individual">Individual</option><option value="business">Empresa</option></select>
          <input className={F} placeholder="Tax ID / EIN" value={d.tax_id} onChange={(e) => set({ tax_id: e.target.value })} />
          {d.customer_type === "business" && <input className={F} placeholder="Razón social" value={d.company_name} onChange={(e) => set({ company_name: e.target.value })} />}
          {d.customer_type === "business" && <input className={F} placeholder="Nombre comercial" value={d.display_name} onChange={(e) => set({ display_name: e.target.value })} />}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-muted-foreground">Límite de crédito $<input type="number" className={F} value={d.credit_limit} onChange={(e) => set({ credit_limit: e.target.value })} /></label>
          <label className="text-xs text-muted-foreground">Términos de pago<select className={F} value={d.payment_terms} onChange={(e) => set({ payment_terms: e.target.value })}>{["immediate", "net_15", "net_30", "net_60", "net_90", "custom"].map((v) => <option key={v} value={v}>{v}</option>)}</select></label>
          {d.payment_terms === "custom" && <label className="text-xs text-muted-foreground">Días<input type="number" className={F} value={d.payment_terms_custom_days} onChange={(e) => set({ payment_terms_custom_days: e.target.value })} /></label>}
        </div>
        <textarea className={F} rows={2} placeholder="Notas internas" value={d.notes_for_team} onChange={(e) => set({ notes_for_team: e.target.value })} />
        <div className="flex gap-2">
          <button type="button" disabled={!d.full_name.trim()} onClick={submit} className="flex-1 rounded-lg bg-primary py-2 text-sm font-bold text-primary-foreground disabled:opacity-40">Guardar</button>
          <button type="button" onClick={onClose} className="rounded-lg bg-secondary px-4 py-2 text-sm text-foreground">Cancelar</button>
        </div>
      </div>
    </div>
  );
}
