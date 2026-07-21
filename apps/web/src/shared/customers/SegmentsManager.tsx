import { useState } from "react";
import { X, Plus, Pencil, Trash2 } from "lucide-react";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { useToast } from "@shared/providers/toast-context";
import { useCustomerSegments } from "@shared/customers/useCustomerSegments.hook";
import { SegmentDialog } from "@shared/customers/SegmentDialog";
import type { CustomerSegment } from "@shared/customers/customer-segments.repository";

const PT: Record<string, string> = { immediate: "Inmediato", net_15: "Net 15", net_30: "Net 30", net_60: "Net 60", net_90: "Net 90" };

// Gestor de segmentos del tenant (modal): lista con color/descuento/término + CRUD gateado. onChanged refresca la lista de clientes.
export function SegmentsManager({ tenantId, onClose, onChanged }: { tenantId: string; onClose: () => void; onChanged: () => void }) {
  const { can } = useModuleAccess(); const toast = useToast();
  const seg = useCustomerSegments(tenantId);
  const [editing, setEditing] = useState<CustomerSegment | null | undefined>(undefined);
  const edit = can("customers", "edit"); const del = can("customers", "delete");
  const run = async (e: string | null) => { if (e) toast.error(e); else { toast.success("Guardado"); onChanged(); } };
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-lg space-y-3 overflow-y-auto rounded-xl border border-border bg-card p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-foreground">Segmentos de cliente</h3>
          <button type="button" onClick={onClose} aria-label="Cerrar"><X className="h-5 w-5" /></button>
        </div>
        {edit && <button type="button" onClick={() => setEditing(null)} className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-sm font-bold text-primary-foreground"><Plus className="h-4 w-4" />Nuevo segmento</button>}
        {seg.segments.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">Sin segmentos. Crea el primero (VIP, Mayorista…).</p>}
        <div className="space-y-2">{seg.segments.map((sg) => (
          <div key={sg.id} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background p-2.5 text-sm">
            <div className="flex min-w-0 items-center gap-2">
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: sg.color }} />
              <div className="min-w-0"><p className="font-medium text-foreground">{sg.name}{!sg.isActive && <span className="ml-1 text-xs text-muted-foreground">(inactivo)</span>}</p>
                <p className="text-xs text-muted-foreground">{sg.defaultDiscountPct}% desc.{sg.defaultPaymentTerms ? ` · ${PT[sg.defaultPaymentTerms] ?? sg.defaultPaymentTerms}` : ""}</p></div>
            </div>
            <div className="flex shrink-0 gap-2">
              {edit && <button type="button" onClick={() => setEditing(sg)} className="text-muted-foreground hover:text-foreground"><Pencil className="h-4 w-4" /></button>}
              {del && <button type="button" onClick={async () => { if (confirm(`¿Eliminar "${sg.name}"? Los clientes quedarán sin segmento.`)) run(await seg.remove(sg.id)); }} className="text-red-500/70 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>}
            </div>
          </div>))}
        </div>
      </div>
      {editing !== undefined && <SegmentDialog initial={editing} onClose={() => setEditing(undefined)} onSave={async (p) => { setEditing(undefined); run(await seg.save(p)); }} />}
    </div>
  );
}
