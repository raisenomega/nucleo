import { useState } from "react";
import { X, Plus, Pencil, Trash2 } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useToast } from "@shared/providers/toast-context";
import { ScreenModal } from "@shared/components/ScreenModal";
import { useWarehouses } from "@fieldops/application/useWarehouses.hook";
import { supabaseWarehouseRepository } from "@fieldops/infrastructure/supabase-warehouse.repository";
import type { WarehouseFormData, Warehouse } from "@fieldops/domain/warehouse.types";

const EMPTY: WarehouseFormData = { name: "", code: "", address: "", notes: "" };

// Mini-admin de almacenes (patrón UomManagerModal): lista + crear/editar + borrar (bloqueado si hay stock > 0 / es default).
export function WarehouseManagerModal({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const toast = useToast();
  const wh = useWarehouses(supabaseWarehouseRepository);
  const [editing, setEditing] = useState<string | null>(null);
  const [f, setF] = useState<WarehouseFormData>(EMPTY);
  const field = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  async function save() {
    if (!f.name.trim() || !f.code.trim()) return;
    const r = editing === "new" ? await wh.create(f) : await wh.update(editing as string, f);
    if (r.ok) { setEditing(null); toast.success(t("saved")); } else toast.error(r.error);
  }
  async function del(w: Warehouse) {
    if (w.isDefault || !window.confirm(`${t("delete")}?`)) return;
    const r = await wh.remove(w.id);
    if (!r.ok) toast.error(r.error === "cannotDeleteWithStock" ? t("cannotDeleteWithStock") : r.error);
  }
  return (
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-display text-lg font-bold text-foreground">{t("warehouseManager")}</h2>
        <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
      </div>
      <div className="space-y-3 p-4">
        {editing ? (
          <div className="space-y-2 rounded-lg border border-border p-3">
            <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder={t("name")} className={field} />
            <input value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} placeholder={t("warehouseCode")} className={field} />
            <input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} placeholder={t("address")} className={field} />
            <input value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} placeholder={t("notes")} className={field} />
            <div className="flex gap-2"><button type="button" onClick={() => void save()} className="rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-sm font-bold">{t("save")}</button><button type="button" onClick={() => setEditing(null)} className="text-xs text-muted-foreground">{t("cancel")}</button></div>
          </div>
        ) : (
          <button type="button" onClick={() => { setF(EMPTY); setEditing("new"); }} className="flex items-center gap-1 text-sm font-bold text-primary"><Plus className="h-4 w-4" /> {t("newWarehouse")}</button>
        )}
        <ul className="divide-y divide-border">
          {wh.warehouses.map((w) => (
            <li key={w.id} className="flex items-center gap-2 py-2 text-sm">
              <span className="font-semibold">{w.name}</span><span className="text-muted-foreground">({w.code})</span>
              {w.isDefault && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">{t("mainWarehouse")}</span>}
              <span className="ml-auto flex items-center gap-3">
                <button type="button" onClick={() => { setF({ name: w.name, code: w.code, address: w.address ?? "", notes: w.notes ?? "" }); setEditing(w.id); }} aria-label={t("edit")}><Pencil className="h-4 w-4" /></button>
                <button type="button" disabled={w.isDefault} onClick={() => void del(w)} aria-label={t("delete")} className="text-destructive disabled:opacity-30"><Trash2 className="h-4 w-4" /></button>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </ScreenModal>
  );
}
