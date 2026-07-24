import { useState } from "react";
import { X, Plus, Pencil, Trash2 } from "lucide-react";
import { useI18n } from "@shared/i18n";
import type { TranslationKey } from "@shared/i18n";
import { useToast } from "@shared/providers/toast-context";
import { ScreenModal } from "@shared/components/ScreenModal";
import { useUnitsOfMeasure } from "@fieldops/application/useUnitsOfMeasure.hook";
import { supabaseUomRepository } from "@fieldops/infrastructure/supabase-unit-of-measure.repository";
import type { UomFormData, UomGroup, UnitOfMeasure } from "@fieldops/domain/unit-of-measure.types";
import type { InventoryItem } from "@fieldops/domain/inventory.types";

const GROUPS: UomGroup[] = ["count", "volume", "weight", "length", "area", "time", "other"];
const EMPTY: UomFormData = { name: "", abbreviation: "", uomGroup: "count", active: true };

// Mini-admin de UOM (Task 4): lista + crear/editar/toggle activo + borrar (bloqueado si hay ítems usándola).
export function UomManagerModal({ items, onClose }: { items: readonly InventoryItem[]; onClose: () => void }) {
  const { t } = useI18n();
  const toast = useToast();
  const uom = useUnitsOfMeasure(supabaseUomRepository);
  const [editing, setEditing] = useState<string | null>(null);
  const [f, setF] = useState<UomFormData>(EMPTY);
  const usage = (id: string) => items.filter((i) => i.unitOfMeasureId === id).length;
  const field = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  async function save() {
    if (!f.name.trim() || !f.abbreviation.trim()) return;
    const r = editing === "new" ? await uom.create(f) : await uom.update(editing as string, f);
    if (r.ok) { setEditing(null); toast.success(t("saved")); } else toast.error(r.error);
  }
  async function toggle(u: UnitOfMeasure) {
    const r = await uom.update(u.id, { name: u.name, abbreviation: u.abbreviation, uomGroup: u.uomGroup, active: !u.active });
    if (!r.ok) toast.error(r.error);
  }
  async function del(id: string) {
    if (usage(id) > 0 || !window.confirm(`${t("delete")}?`)) return;
    const r = await uom.remove(id); if (!r.ok) toast.error(r.error);
  }
  return (
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-display text-lg font-bold text-foreground">{t("manageUnits")}</h2>
        <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
      </div>
      <div className="space-y-3 p-4">
        {editing ? (
          <div className="space-y-2 rounded-lg border border-border p-3">
            <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder={t("name")} className={field} />
            <input value={f.abbreviation} onChange={(e) => setF({ ...f, abbreviation: e.target.value })} placeholder={t("abbreviation")} className={field} />
            <select value={f.uomGroup} onChange={(e) => setF({ ...f, uomGroup: e.target.value as UomGroup })} className={field} aria-label={t("uomGroup")}>{GROUPS.map((g) => <option key={g} value={g}>{t(g as TranslationKey)}</option>)}</select>
            <div className="flex gap-2"><button type="button" onClick={() => void save()} className="rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-sm font-bold">{t("save")}</button><button type="button" onClick={() => setEditing(null)} className="text-xs text-muted-foreground">{t("cancel")}</button></div>
          </div>
        ) : (
          <button type="button" onClick={() => { setF(EMPTY); setEditing("new"); }} className="flex items-center gap-1 text-sm font-bold text-primary"><Plus className="h-4 w-4" /> {t("createUnit")}</button>
        )}
        <ul className="divide-y divide-border">
          {uom.items.map((u) => (
            <li key={u.id} className={`flex items-center gap-2 py-2 text-sm ${u.active ? "" : "opacity-50"}`}>
              <span className="font-semibold">{u.name}</span><span className="text-muted-foreground">({u.abbreviation})</span>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">{t(u.uomGroup as TranslationKey)}</span>
              <span className="ml-auto flex items-center gap-3">
                <input type="checkbox" checked={u.active} onChange={() => void toggle(u)} aria-label={t("active")} />
                <button type="button" onClick={() => { setF({ name: u.name, abbreviation: u.abbreviation, uomGroup: u.uomGroup, active: u.active }); setEditing(u.id); }} aria-label={t("edit")}><Pencil className="h-4 w-4" /></button>
                <button type="button" disabled={usage(u.id) > 0} onClick={() => void del(u.id)} aria-label={t("delete")} className="text-destructive disabled:opacity-30"><Trash2 className="h-4 w-4" /></button>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </ScreenModal>
  );
}
