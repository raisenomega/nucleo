import { useEffect, useState } from "react";
import { supabase } from "@shared/lib/supabase";
import { useI18n } from "@shared/i18n";

// Selector de lote/serie disponible de un ítem (self-load, FEFO: vence primero). Filtra por almacén si viene.
type Lot = { id: string; lot_number: string; quantity: number; expiry_date: string | null; lot_type: string };
export function LotPicker({ itemId, warehouseId, value, onChange, label }: {
  itemId: string; warehouseId?: string | null; value: string; onChange: (v: string) => void; label?: string;
}) {
  const { t } = useI18n();
  const [lots, setLots] = useState<Lot[]>([]);
  useEffect(() => {
    let q = supabase.from("inventory_lots").select("id,lot_number,quantity,expiry_date,lot_type").eq("item_id", itemId).eq("status", "available").gt("quantity", 0).order("expiry_date", { ascending: true, nullsFirst: false });
    if (warehouseId) q = q.eq("warehouse_id", warehouseId);
    void q.then(({ data }) => setLots((data as Lot[] | null) ?? []));
  }, [itemId, warehouseId]);
  return (
    <label className="block space-y-1">
      <span className="text-xs font-bold text-muted-foreground">{label ?? t("selectLot")}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-border bg-background p-2 text-sm">
        <option value="">—</option>
        {lots.map((l) => <option key={l.id} value={l.id}>{l.lot_number} ({l.lot_type === "serial" ? t("available") : l.quantity}{l.expiry_date ? ` · ${l.expiry_date.slice(0, 10)}` : ""})</option>)}
      </select>
    </label>
  );
}
