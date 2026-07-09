import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import { supabaseRouteRepository } from "@operations/infrastructure/supabase-route.repository";
import { supabaseInventoryRepository } from "@fieldops/infrastructure/supabase-inventory.repository";
import type { InventoryItem } from "@fieldops/domain/inventory.types";
import type { StopSupply } from "@operations/domain/route.types";

// Materiales usados en una parada: descuenta stock (RPC). Muestra lo ya registrado.
export function StopSuppliesForm({ stopId, onClose }: { stopId: string; onClose: () => void }) {
  const { t } = useI18n();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [used, setUsed] = useState<readonly StopSupply[]>([]);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const loadItems = () => void supabaseInventoryRepository.list().then((r) => { if (r.ok) setItems(r.value); });
  const loadUsed = () => void supabaseRouteRepository.listSupplies(stopId).then(setUsed);
  useEffect(() => { loadItems(); loadUsed(); }, [stopId]);

  async function save() {
    const picked = Object.entries(qty).filter(([, q]) => q > 0).map(([itemId, quantity]) => ({ itemId, quantity }));
    if (!picked.length) return;
    setBusy(true);
    const r = await supabaseRouteRepository.recordSupplies(stopId, picked);
    setBusy(false);
    if (!r.ok) { window.alert(r.error); return; }
    setQty({}); loadItems(); loadUsed();
  }
  const fld = "w-20 rounded-lg border border-border bg-background p-2 text-center text-sm";
  return (
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-display text-lg font-bold text-primary">{t("supplies")}</h2>
        <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
      </div>
      <div className="space-y-3 p-4">
        {used.length > 0 && <div className="rounded-lg bg-secondary p-3 text-sm">
          <p className="font-bold">{t("usedSupplies")}</p>
          {used.map((u) => <p key={u.itemId} className="text-muted-foreground">{u.name}: {u.quantity}</p>)}</div>}
        {items.map((it) => (
          <div key={it.id} className="flex items-center justify-between gap-2 rounded-lg border border-border p-3">
            <div><p className="font-semibold">{it.name}</p><p className="text-xs text-muted-foreground">{t("stock")}: {it.stock}</p></div>
            <input type="number" min={0} max={it.stock} value={qty[it.id] || ""} placeholder="0"
              onChange={(e) => setQty({ ...qty, [it.id]: Math.min(it.stock, Math.max(0, Number(e.target.value))) })} className={fld} />
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-muted-foreground">{t("noRecords")}</p>}
        <button type="button" disabled={busy} onClick={() => void save()} className="w-full rounded-lg bg-primary text-primary-foreground py-3 font-bold disabled:opacity-50">{t("save")}</button>
      </div>
    </ScreenModal>
  );
}
