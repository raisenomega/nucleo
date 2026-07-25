import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { supabase } from "@shared/lib/supabase";
import { useI18n } from "@shared/i18n";
import type { TranslationKey } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import { CategoryPicker } from "@shared/components/CategoryPicker";
import type { CountFormData, CountType } from "@fieldops/domain/inventory-count.types";
import type { InventoryItem } from "@fieldops/domain/inventory.types";

const TYPES: [CountType, TranslationKey][] = [["full", "fullCount"], ["category", "categoryCount"], ["low_stock", "lowStockCount"], ["partial", "partialCount"]];
type Emp = { id: string; full_name: string | null };

export function CreateCountModal({ items, onSubmit, onClose }: { items: readonly InventoryItem[]; onSubmit: (d: CountFormData) => void; onClose: () => void }) {
  const { t } = useI18n();
  const [type, setType] = useState<CountType>("full");
  const [categoryId, setCategoryId] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [blind, setBlind] = useState(true);
  const [notes, setNotes] = useState("");
  const [ids, setIds] = useState<string[]>([]);
  const [emps, setEmps] = useState<Emp[]>([]);
  const [wh, setWh] = useState("");
  const [whs, setWhs] = useState<{ id: string; name: string; code: string }[]>([]);
  const field = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  useEffect(() => {
    void supabase.from("profiles").select("id,full_name").order("full_name").then(({ data }) => setEmps((data as Emp[] | null) ?? []));
    void supabase.from("warehouses").select("id,name,code").is("deleted_at", null).order("is_default", { ascending: false }).then(({ data }) => setWhs((data as typeof whs | null) ?? []));
  }, []);
  const toggle = (id: string) => setIds((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
  const disabled = (type === "category" && !categoryId) || (type === "partial" && ids.length === 0);
  const go = () => onSubmit({ countType: type, categoryId: type === "category" ? categoryId || null : null, assignedTo: assignedTo || null, blindCount: blind, notes, itemIds: type === "partial" ? ids : [], warehouseId: wh || null });
  return (
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-display text-lg font-bold text-foreground">{t("createCount")}</h2>
        <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
      </div>
      <div className="space-y-3 p-4">
        <label className="block space-y-1"><span className="text-xs font-bold text-muted-foreground">{t("countType")}</span>
          <select value={type} onChange={(e) => setType(e.target.value as CountType)} className={field}>{TYPES.map(([v, k]) => <option key={v} value={v}>{t(k)}</option>)}</select></label>
        {type === "category" && <CategoryPicker kind="inventory_category" label="category" value={categoryId} onChange={setCategoryId} />}
        {type === "partial" && <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
          {items.map((i) => <label key={i.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={ids.includes(i.id)} onChange={() => toggle(i.id)} />{i.name}</label>)}
        </div>}
        <label className="block space-y-1"><span className="text-xs font-bold text-muted-foreground">{t("warehouse")}</span>
          <select value={wh} onChange={(e) => setWh(e.target.value)} className={field}><option value="">{t("allWarehouses")}</option>{whs.map((w) => <option key={w.id} value={w.id}>{w.name} ({w.code})</option>)}</select></label>
        <label className="block space-y-1"><span className="text-xs font-bold text-muted-foreground">{t("assignTo")}</span>
          <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className={field}><option value="">—</option>{emps.map((e) => <option key={e.id} value={e.id}>{e.full_name ?? e.id}</option>)}</select></label>
        <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={blind} onChange={(e) => setBlind(e.target.checked)} className="mt-1" /><span><b>{t("blindCount")}</b> — {t("blindCountExplain")}</span></label>
        <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("notes")} className={field} />
        <div className="flex gap-2"><button type="button" disabled={disabled} onClick={go} className="rounded-lg bg-primary text-primary-foreground px-4 py-2 font-bold disabled:opacity-50">{t("createCount")}</button><button type="button" onClick={onClose} className="rounded-lg bg-secondary px-4 py-2 text-foreground">{t("cancel")}</button></div>
      </div>
    </ScreenModal>
  );
}
