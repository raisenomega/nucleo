import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { useToast } from "@shared/providers/toast-context";
import { getAddons, saveAddon, deleteAddon, setAddonFields } from "@raisen-marketing/infrastructure/marketing-addons.repository";
import type { PricingAddonRow, PricingAddonDraft } from "@raisen-marketing/data/pricing.types";
import { AddonDialog } from "@raisen-marketing/admin/AddonDialog";
import { periodLabel } from "@raisen-marketing/data/billing-period";

// Sección Add-ons dentro de /web/precios: CRUD + reorder ↑↓ + toggle activo. Autocontenida (carga sus datos).
export function AddonsSection() {
  const toast = useToast();
  const [items, setItems] = useState<PricingAddonRow[]>([]);
  const [edit, setEdit] = useState<{ open: boolean; initial: PricingAddonRow | null }>({ open: false, initial: null });
  const reload = () => { void getAddons(false).then(setItems); };
  useEffect(() => { reload(); }, []);
  const done = (e: string | null) => { if (e) toast.error(e); else reload(); };
  const onSave = async (a: PricingAddonDraft) => { const e = await saveAddon(a); if (e) return toast.error(e); setEdit({ open: false, initial: null }); toast.success("Guardado"); reload(); };
  const move = async (i: number, dir: -1 | 1) => {
    const a = items[i], b = items[i + dir]; if (!a || !b) return;
    await setAddonFields(a.id, { display_order: b.displayOrder });
    done(await setAddonFields(b.id, { display_order: a.displayOrder }));
  };
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-foreground">Add-ons ({items.length})</h2>
        <button type="button" onClick={() => setEdit({ open: true, initial: null })} className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground"><Plus className="h-4 w-4" />Nuevo</button>
      </div>
      {items.map((a, i) => (
        <div key={a.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{a.nameEs} / {a.nameEn}</p>
            <p className="text-xs text-muted-foreground">+${a.price.toLocaleString()} {a.currency}{periodLabel(a.billingPeriod, "es")} · orden {a.displayOrder}</p>
          </div>
          <button type="button" onClick={() => void move(i, -1)} disabled={i === 0} aria-label="subir" className="rounded p-1 text-muted-foreground disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
          <button type="button" onClick={() => void move(i, 1)} disabled={i === items.length - 1} aria-label="bajar" className="rounded p-1 text-muted-foreground disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
          <label className="flex items-center gap-1 text-xs text-muted-foreground"><input type="checkbox" checked={a.isActive} onChange={(e) => void setAddonFields(a.id, { is_active: e.target.checked }).then(done)} />activo</label>
          <button type="button" onClick={() => setEdit({ open: true, initial: a })} aria-label="editar" className="rounded p-1 text-muted-foreground hover:text-foreground"><Pencil className="h-4 w-4" /></button>
          <button type="button" onClick={() => { if (window.confirm(`¿Eliminar "${a.nameEs}"?`)) void deleteAddon(a.id).then(done); }} aria-label="eliminar" className="rounded p-1 text-destructive"><Trash2 className="h-4 w-4" /></button>
        </div>
      ))}
      {edit.open && <AddonDialog initial={edit.initial} onClose={() => setEdit({ open: false, initial: null })} onSave={onSave} />}
    </div>
  );
}
