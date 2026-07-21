import { useState } from "react";
import { MapPin, Users, Plus, Pencil, Trash2, Star } from "lucide-react";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { useToast } from "@shared/providers/toast-context";
import { useCustomerSatellites } from "@shared/customers/useCustomerSatellites.hook";
import { AddressDialog } from "@shared/customers/AddressDialog";
import { ContactDialog } from "@shared/customers/ContactDialog";
import type { CustomerAddress, CustomerContact } from "@shared/customers/customer-satellites.repository";

const TYPE: Record<string, string> = { billing: "Facturación", shipping: "Envío", service: "Servicio", other: "Otra" };
const Row = ({ children, onEdit, onDel }: { children: React.ReactNode; onEdit?: () => void; onDel?: () => void }) => (
  <div className="flex items-start justify-between gap-2 rounded-lg border border-border bg-background p-2.5 text-sm">
    <div className="min-w-0">{children}</div>
    <div className="flex shrink-0 gap-2">{onEdit && <button type="button" onClick={onEdit} className="text-muted-foreground hover:text-foreground"><Pencil className="h-4 w-4" /></button>}{onDel && <button type="button" onClick={onDel} className="text-red-500/70 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>}</div>
  </div>
);

// Pestañas Direcciones/Contactos del detalle del cliente. Escritura gateada por customers:edit/delete.
export function CustomerSatellites({ customerId }: { customerId: string }) {
  const { can } = useModuleAccess(); const toast = useToast();
  const s = useCustomerSatellites(customerId);
  const [tab, setTab] = useState<"addr" | "cont">("addr");
  const [addr, setAddr] = useState<CustomerAddress | null | undefined>(undefined);
  const [cont, setCont] = useState<CustomerContact | null | undefined>(undefined);
  const edit = can("customers", "edit"); const del = can("customers", "delete");
  const run = async (e: string | null) => { if (e) toast.error(e); else toast.success("Guardado"); };
  const tabCls = (on: boolean) => `inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold ${on ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`;
  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setTab("addr")} className={tabCls(tab === "addr")}><MapPin className="h-4 w-4" />Direcciones ({s.addresses.length})</button>
        <button type="button" onClick={() => setTab("cont")} className={tabCls(tab === "cont")}><Users className="h-4 w-4" />Contactos ({s.contacts.length})</button>
        {edit && <button type="button" onClick={() => (tab === "addr" ? setAddr(null) : setCont(null))} className="ml-auto inline-flex items-center gap-1 rounded-lg bg-secondary px-2.5 py-1.5 text-sm font-bold text-foreground"><Plus className="h-4 w-4" />Añadir</button>}
      </div>
      {tab === "addr" ? (
        <div className="space-y-2">
          {s.addresses.length === 0 && <p className="py-3 text-center text-sm text-muted-foreground">Sin direcciones.</p>}
          {s.addresses.map((a) => (
            <Row key={a.id} onEdit={edit ? () => setAddr(a) : undefined} onDel={del ? async () => { if (confirm("¿Eliminar dirección?")) await run(await s.removeAddress(a.id)); } : undefined}>
              <p className="font-medium text-foreground">{a.line1}{a.is_default && <Star className="ml-1 inline h-3 w-3 fill-amber-400 text-amber-400" />}</p>
              <p className="text-xs text-muted-foreground">{TYPE[a.address_type] ?? a.address_type}{a.city ? ` · ${a.city}` : ""}{a.label ? ` · ${a.label}` : ""}</p>
            </Row>))}
        </div>
      ) : (
        <div className="space-y-2">
          {s.contacts.length === 0 && <p className="py-3 text-center text-sm text-muted-foreground">Sin contactos.</p>}
          {s.contacts.map((c) => (
            <Row key={c.id} onEdit={edit ? () => setCont(c) : undefined} onDel={del ? async () => { if (confirm("¿Eliminar contacto?")) await run(await s.removeContact(c.id)); } : undefined}>
              <p className="font-medium text-foreground">{c.name}{c.is_primary && <Star className="ml-1 inline h-3 w-3 fill-amber-400 text-amber-400" />}</p>
              <p className="text-xs text-muted-foreground">{[c.role, c.email, c.phone].filter(Boolean).join(" · ") || "—"}</p>
            </Row>))}
        </div>
      )}
      {addr !== undefined && <AddressDialog customerId={customerId} initial={addr} onClose={() => setAddr(undefined)} onSave={async (p) => { setAddr(undefined); await run(await s.saveAddress(p)); }} />}
      {cont !== undefined && <ContactDialog customerId={customerId} initial={cont} onClose={() => setCont(undefined)} onSave={async (p) => { setCont(undefined); await run(await s.saveContact(p)); }} />}
    </div>
  );
}
