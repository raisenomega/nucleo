import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { supabase } from "@shared/lib/supabase";
import { useSession } from "@shared/providers/SessionProvider";

export interface PickedCustomer { id: string; name: string; phone: string; email: string; address: string; }
type Row = Record<string, unknown>;
const s = (v: unknown) => (v as string | null) ?? "";

// Buscador sobre el maestro (nombre/empresa/email) con debounce. Al elegir devuelve el cliente para autocompletar.
export function CustomerSelect({ onPick }: { onPick: (c: PickedCustomer) => void }) {
  const { session } = useSession();
  const [q, setQ] = useState(""); const [rows, setRows] = useState<Row[]>([]); const [open, setOpen] = useState(false);
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setRows([]); return; }
    const h = setTimeout(async () => {
      const { data } = await supabase.from("customer_profiles")
        .select("id, full_name, company_name, email, phone, address, city, state")
        .eq("tenant_id", session?.tenantId ?? "")
        .or(`full_name.ilike.%${term}%,company_name.ilike.%${term}%,email.ilike.%${term}%`).limit(8);
      setRows((data as Row[] | null) ?? []); setOpen(true);
    }, 250);
    return () => clearTimeout(h);
  }, [q, session?.tenantId]);
  const pick = (r: Row) => {
    onPick({ id: r.id as string, name: s(r.full_name) || s(r.company_name) || s(r.email),
      phone: s(r.phone), email: s(r.email), address: [s(r.address), s(r.city), s(r.state)].filter(Boolean).join(", ") });
    setQ(""); setRows([]); setOpen(false);
  };
  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-lg border border-border bg-background p-2 text-sm">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar cliente del maestro…" className="w-full bg-transparent outline-none" />
        {q && <button type="button" onClick={() => { setQ(""); setRows([]); }}><X className="h-4 w-4 text-muted-foreground" /></button>}
      </div>
      {open && rows.length > 0 && (
        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-border bg-card shadow-lg">
          {rows.map((r) => (
            <button key={r.id as string} type="button" onClick={() => pick(r)} className="block w-full px-3 py-2 text-left text-sm hover:bg-secondary">
              <span className="font-medium text-foreground">{s(r.full_name) || s(r.company_name) || "—"}</span> <span className="text-xs text-muted-foreground">{s(r.email)}</span>
            </button>))}
        </div>
      )}
    </div>
  );
}
