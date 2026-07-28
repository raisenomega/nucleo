import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { supabase } from "@shared/lib/supabase";
import { useSession } from "@shared/providers/SessionProvider";

export interface PickedItem { itemId: string; name: string; sku: string | null; unitCost: number; stock: number; reserved: number; }
type Row = Record<string, unknown>;

// Buscador sobre inventory_items (nombre/SKU) con debounce. Devuelve el ítem + su stock/reserva (para ATP en el SO).
export function InventoryItemSelect({ onPick }: { onPick: (p: PickedItem) => void }) {
  const { session } = useSession();
  const [q, setQ] = useState(""); const [rows, setRows] = useState<Row[]>([]); const [open, setOpen] = useState(false);
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setRows([]); return; }
    const h = setTimeout(async () => {
      const { data } = await supabase.from("inventory_items").select("id,name,sku,avg_cost,unit_cost,stock,reserved")
        .eq("tenant_id", session?.tenantId ?? "").or(`name.ilike.%${term}%,sku.ilike.%${term}%`).limit(8);
      setRows((data as Row[] | null) ?? []); setOpen(true);
    }, 250);
    return () => clearTimeout(h);
  }, [q, session?.tenantId]);
  const pick = (r: Row) => {
    onPick({ itemId: r.id as string, name: (r.name as string) ?? "", sku: (r.sku as string | null) ?? null,
      unitCost: Number(r.avg_cost ?? r.unit_cost ?? 0), stock: Number(r.stock ?? 0), reserved: Number(r.reserved ?? 0) });
    setQ(""); setRows([]); setOpen(false);
  };
  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-lg border border-border bg-background p-2 text-sm">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Añadir ítem de inventario…" className="w-full bg-transparent outline-none" />
        {q && <button type="button" onClick={() => { setQ(""); setRows([]); }}><X className="h-4 w-4 text-muted-foreground" /></button>}
      </div>
      {open && rows.length > 0 && (
        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-border bg-card shadow-lg">
          {rows.map((r) => (
            <button key={r.id as string} type="button" onClick={() => pick(r)} className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-secondary">
              <span className="font-medium text-foreground">{(r.name as string) ?? "—"}{r.sku ? <span className="ml-1 text-xs text-muted-foreground">{r.sku as string}</span> : null}</span>
              <span className="text-xs text-muted-foreground">{Number(r.stock ?? 0) - Number(r.reserved ?? 0)} disp.</span>
            </button>))}
        </div>)}
    </div>
  );
}
