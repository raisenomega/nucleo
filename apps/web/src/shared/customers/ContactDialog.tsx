import { useState } from "react";
import type { CustomerContact, Payload } from "@shared/customers/customer-satellites.repository";

const F = "w-full rounded-lg border border-border bg-background p-2 text-sm text-foreground";
const blank = (customerId: string): Payload => ({ customer_id: customerId, name: "", role: "", email: "", phone: "", is_primary: false, notes: "" });

// Alta/edición de un contacto del cliente. is_primary es exclusivo por cliente (lo resuelve la RPC).
export function ContactDialog({ customerId, initial, onClose, onSave }: { customerId: string; initial: CustomerContact | null; onClose: () => void; onSave: (p: Payload) => void }) {
  const [d, setD] = useState<Payload>(initial ? { ...initial } : blank(customerId));
  const set = (p: Payload) => setD((x) => ({ ...x, ...p }));
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-md space-y-2 overflow-y-auto rounded-xl border border-border bg-card p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-lg font-bold text-foreground">{initial ? "Editar" : "Nuevo"} contacto</h3>
        <input className={F} placeholder="Nombre *" value={String(d.name ?? "")} onChange={(e) => set({ name: e.target.value })} />
        <input className={F} placeholder="Cargo (Compras, Pagos…)" value={String(d.role ?? "")} onChange={(e) => set({ role: e.target.value })} />
        <div className="grid grid-cols-2 gap-2">
          <input className={F} type="email" placeholder="Email" value={String(d.email ?? "")} onChange={(e) => set({ email: e.target.value })} />
          <input className={F} placeholder="Teléfono" value={String(d.phone ?? "")} onChange={(e) => set({ phone: e.target.value })} />
        </div>
        <label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={!!d.is_primary} onChange={(e) => set({ is_primary: e.target.checked })} />Contacto principal</label>
        <div className="flex gap-2 pt-1">
          <button type="button" disabled={!String(d.name ?? "").trim()} onClick={() => onSave(d)} className="flex-1 rounded-lg bg-primary py-2 text-sm font-bold text-primary-foreground disabled:opacity-40">Guardar</button>
          <button type="button" onClick={onClose} className="rounded-lg bg-secondary px-4 py-2 text-sm text-foreground">Cancelar</button>
        </div>
      </div>
    </div>
  );
}
