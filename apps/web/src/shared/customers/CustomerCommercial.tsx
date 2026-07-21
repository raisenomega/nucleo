import { useState } from "react";
import { Ban, Tag } from "lucide-react";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { useToast } from "@shared/providers/toast-context";
import { assignSegment, setCustomerHold, type CustomerSegment } from "@shared/customers/customer-segments.repository";
import { updateCustomer } from "@shared/customers/customer-crm.repository";
import type { AdminCustomer } from "@shared/customers/customers-agg";

const F = "rounded-lg border border-border bg-background p-2 text-sm text-foreground";

// Capa comercial del cliente en su detalle: segmento asignado, descuento override y bloqueo (on_hold) con motivo.
export function CustomerCommercial({ c, segments, onChanged }: { c: AdminCustomer; segments: CustomerSegment[]; onChanged: () => void }) {
  const { can } = useModuleAccess(); const toast = useToast();
  const edit = can("customers", "edit");
  const [disc, setDisc] = useState(String(c.discountPct || 0));
  const [reason, setReason] = useState(c.holdReason || "");
  const seg = segments.find((s) => s.id === c.segmentId);
  const run = async (e: string | null) => { if (e) toast.error(e); else { toast.success("Guardado"); onChanged(); } };
  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      {c.onHold && <div className="flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 p-2.5 text-sm font-bold text-red-600"><Ban className="h-4 w-4 shrink-0" />Cliente bloqueado{c.holdReason ? `: ${c.holdReason}` : ""}</div>}
      <div className="flex items-center gap-2 text-sm font-bold text-foreground"><Tag className="h-4 w-4" />Comercial{seg && <span className="rounded px-1.5 py-0.5 text-xs font-bold text-white" style={{ backgroundColor: seg.color }}>{seg.name}</span>}</div>
      {edit ? (
        <>
          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-1 text-xs text-muted-foreground">Segmento
              <select className={`${F} w-full`} value={c.segmentId || ""} onChange={async (e) => run(await assignSegment(c.id, e.target.value || null, true))}>
                <option value="">— sin segmento —</option>{segments.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">Descuento % (override)
              <input type="number" min={0} max={100} step="0.01" className={`${F} w-full`} value={disc} onChange={(e) => setDisc(e.target.value)}
                onBlur={async () => { if (Number(disc) !== c.discountPct) run(await updateCustomer(c.id, { discount_pct: Number(disc) })); }} />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input className={`${F} min-w-0 flex-1`} placeholder="Motivo del bloqueo" value={reason} onChange={(e) => setReason(e.target.value)} />
            <button type="button" onClick={async () => run(await setCustomerHold(c.id, !c.onHold, reason))} className={`rounded-lg px-3 py-2 text-sm font-bold ${c.onHold ? "bg-secondary text-foreground" : "bg-red-500/90 text-white"}`}>{c.onHold ? "Desbloquear" : "Bloquear"}</button>
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">{seg ? `Segmento: ${seg.name}` : "Sin segmento"} · Descuento: {c.discountPct}%</p>
      )}
    </div>
  );
}
