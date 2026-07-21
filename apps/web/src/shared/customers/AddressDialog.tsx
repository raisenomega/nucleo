import { useState } from "react";
import type { CustomerAddress, Payload } from "@shared/customers/customer-satellites.repository";

const F = "w-full rounded-lg border border-border bg-background p-2 text-sm text-foreground";
const TYPES = [["billing", "Facturación"], ["shipping", "Envío"], ["service", "Servicio"], ["other", "Otra"]] as const;
const blank = (customerId: string): Payload => ({ customer_id: customerId, address_type: "billing", label: "", line1: "", line2: "", city: "", state: "", postal_code: "", country: "US", is_default: false, notes: "" });

// Alta/edición de una dirección del cliente. is_default es exclusivo por tipo (lo resuelve la RPC).
export function AddressDialog({ customerId, initial, onClose, onSave }: { customerId: string; initial: CustomerAddress | null; onClose: () => void; onSave: (p: Payload) => void }) {
  const [d, setD] = useState<Payload>(initial ? { ...initial } : blank(customerId));
  const set = (p: Payload) => setD((x) => ({ ...x, ...p }));
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-md space-y-2 overflow-y-auto rounded-xl border border-border bg-card p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-lg font-bold text-foreground">{initial ? "Editar" : "Nueva"} dirección</h3>
        <div className="grid grid-cols-2 gap-2">
          <select className={F} value={String(d.address_type)} onChange={(e) => set({ address_type: e.target.value })}>{TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          <input className={F} placeholder="Etiqueta (Oficina…)" value={String(d.label ?? "")} onChange={(e) => set({ label: e.target.value })} />
        </div>
        <input className={F} placeholder="Línea 1 *" value={String(d.line1 ?? "")} onChange={(e) => set({ line1: e.target.value })} />
        <input className={F} placeholder="Línea 2" value={String(d.line2 ?? "")} onChange={(e) => set({ line2: e.target.value })} />
        <div className="grid grid-cols-2 gap-2">
          <input className={F} placeholder="Ciudad" value={String(d.city ?? "")} onChange={(e) => set({ city: e.target.value })} />
          <input className={F} placeholder="Estado" value={String(d.state ?? "")} onChange={(e) => set({ state: e.target.value })} />
          <input className={F} placeholder="Código postal" value={String(d.postal_code ?? "")} onChange={(e) => set({ postal_code: e.target.value })} />
          <input className={F} placeholder="País" value={String(d.country ?? "US")} onChange={(e) => set({ country: e.target.value })} />
        </div>
        <label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={!!d.is_default} onChange={(e) => set({ is_default: e.target.checked })} />Predeterminada (de su tipo)</label>
        <div className="flex gap-2 pt-1">
          <button type="button" disabled={!String(d.line1 ?? "").trim()} onClick={() => onSave(d)} className="flex-1 rounded-lg bg-primary py-2 text-sm font-bold text-primary-foreground disabled:opacity-40">Guardar</button>
          <button type="button" onClick={onClose} className="rounded-lg bg-secondary px-4 py-2 text-sm text-foreground">Cancelar</button>
        </div>
      </div>
    </div>
  );
}
