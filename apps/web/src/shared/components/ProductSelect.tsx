import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { supabase } from "@shared/lib/supabase";
import { useSession } from "@shared/providers/SessionProvider";

export interface PickedProduct { id: string; name: string; price: number; sku: string | null; }
type Row = Record<string, unknown>;

// Buscador sobre el catálogo (tenant_landing_products) por nombre/SKU, con debounce. Devuelve el producto elegido.
export function ProductSelect({ onPick }: { onPick: (p: PickedProduct) => void }) {
  const { session } = useSession();
  const [q, setQ] = useState(""); const [rows, setRows] = useState<Row[]>([]); const [open, setOpen] = useState(false);
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setRows([]); return; }
    const h = setTimeout(async () => {
      const { data } = await supabase.from("tenant_landing_products").select("id, name, price, sku")
        .eq("tenant_id", session?.tenantId ?? "").or(`name.ilike.%${term}%,sku.ilike.%${term}%`).limit(8);
      setRows((data as Row[] | null) ?? []); setOpen(true);
    }, 250);
    return () => clearTimeout(h);
  }, [q, session?.tenantId]);
  const pick = (r: Row) => {
    onPick({ id: r.id as string, name: (r.name as string) ?? "", price: Number(r.price ?? 0), sku: (r.sku as string | null) ?? null });
    setQ(""); setRows([]); setOpen(false);
  };
  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-lg border border-border bg-background p-2 text-sm">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Añadir producto del catálogo…" className="w-full bg-transparent outline-none" />
        {q && <button type="button" onClick={() => { setQ(""); setRows([]); }}><X className="h-4 w-4 text-muted-foreground" /></button>}
      </div>
      {open && rows.length > 0 && (
        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-border bg-card shadow-lg">
          {rows.map((r) => (
            <button key={r.id as string} type="button" onClick={() => pick(r)} className="block w-full px-3 py-2 text-left text-sm hover:bg-secondary">
              <span className="font-medium text-foreground">{(r.name as string) ?? "—"}</span>{r.sku ? <span className="ml-1 text-xs text-muted-foreground">{r.sku as string}</span> : null}
            </button>))}
        </div>
      )}
    </div>
  );
}
