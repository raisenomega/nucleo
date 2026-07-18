import { useEffect, useMemo, useState } from "react";
import { supabase } from "@shared/lib/supabase";
import { slowIds, highIds, type RawMov } from "@fieldops/application/inventory-analytics";
import type { InventoryItem } from "@fieldops/domain/inventory.types";

interface Rec { item_id: string; movement_type: string; quantity: number | string; unit_cost: number | string; movement_date: string }

// Carga todos los movimientos del tenant (RLS por tenant) y deriva sets de stock lento / consumo anormal.
export function useInventoryAnalytics(items: readonly InventoryItem[]) {
  const [movs, setMovs] = useState<RawMov[]>([]);
  useEffect(() => {
    void supabase.from("inventory_movements").select("item_id, movement_type, quantity, unit_cost, movement_date").is("deleted_at", null)
      .then(({ data }) => setMovs(((data as Rec[] | null) ?? []).map((r) => ({ itemId: r.item_id, type: r.movement_type, quantity: Number(r.quantity), unitCost: Number(r.unit_cost), date: r.movement_date }))));
  }, []);
  const now = useMemo(() => new Date(), []);
  const slow = useMemo(() => slowIds(movs, items, now), [movs, items, now]);
  const high = useMemo(() => highIds(movs, items, now), [movs, items, now]);
  return { movs, slow, high, now };
}
