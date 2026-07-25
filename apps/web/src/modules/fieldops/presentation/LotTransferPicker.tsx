import { useEffect, useState } from "react";
import { supabase } from "@shared/lib/supabase";
import { useI18n } from "@shared/i18n";

// Selecciona qué/cuánto de cada lote del almacén origen transferir. Reporta [{lotId, qty}] al padre.
type Lot = { id: string; lot_number: string; quantity: number; expiry_date: string | null };
export function LotTransferPicker({ itemId, warehouseId, serial, onChange }: {
  itemId: string; warehouseId: string; serial: boolean; onChange: (t: { lotId: string; qty: number }[]) => void;
}) {
  const { t } = useI18n();
  const [lots, setLots] = useState<Lot[]>([]);
  const [qty, setQty] = useState<Record<string, number>>({});
  useEffect(() => {
    void supabase.from("inventory_lots").select("id,lot_number,quantity,expiry_date").eq("item_id", itemId).eq("warehouse_id", warehouseId).eq("status", "available").gt("quantity", 0).order("expiry_date", { ascending: true, nullsFirst: false })
      .then(({ data }) => { setLots((data as Lot[] | null) ?? []); setQty({}); });
  }, [itemId, warehouseId]);
  const set = (id: string, v: number) => { const n = { ...qty, [id]: v }; setQty(n); onChange(Object.entries(n).filter(([, q]) => q > 0).map(([lotId, q]) => ({ lotId, qty: q }))); };
  return (
    <div className="space-y-1">
      <span className="text-xs font-bold text-muted-foreground">{t("lotsToTransfer")}</span>
      {lots.length === 0 && <p className="text-xs text-muted-foreground">—</p>}
      {lots.map((l) => (
        <div key={l.id} className="flex items-center gap-2 text-sm">
          <span className="flex-1">{l.lot_number} <span className="text-muted-foreground">({l.quantity}{l.expiry_date ? ` · ${l.expiry_date.slice(0, 10)}` : ""})</span></span>
          {serial
            ? <input type="checkbox" checked={(qty[l.id] ?? 0) > 0} onChange={(e) => set(l.id, e.target.checked ? 1 : 0)} />
            : <input type="number" min="0" max={l.quantity} value={qty[l.id] || ""} onChange={(e) => set(l.id, Math.min(Number(e.target.value), l.quantity))} className="w-20 rounded border border-border bg-background p-1 text-right text-sm" />}
        </div>
      ))}
    </div>
  );
}
