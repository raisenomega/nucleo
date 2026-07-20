import { useEffect, useState } from "react";
import { Navigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useToast } from "@shared/providers/toast-context";
import { useSuperAdmin } from "@shared/hooks/useSuperAdmin";
import { getPricingTiers, getPricingConfig, savePricingTier, deletePricingTier, setTierFields, setRecommended } from "@raisen-marketing/infrastructure/marketing-pricing.repository";
import type { PricingTierRow, PricingConfig, PricingTierDraft } from "@raisen-marketing/data/pricing.types";
import { PricingDialog } from "@raisen-marketing/admin/PricingDialog";
import { PricingConfigEditor } from "@raisen-marketing/admin/PricingConfigEditor";
import { PricingListRow } from "@raisen-marketing/admin/PricingListRow";
import { AddonsSection } from "@raisen-marketing/admin/AddonsSection";

// Editor /web/precios (Super Admin): config de sección + CRUD de tiers con reorder ↑↓, toggle activo y
// toggle recomendado EXCLUSIVO (solo 1; el repo desmarca los demás).
export function PricingManager() {
  const { isSuperAdmin } = useSuperAdmin();
  const toast = useToast();
  const [config, setConfig] = useState<PricingConfig | null>(null);
  const [items, setItems] = useState<PricingTierRow[]>([]);
  const [edit, setEdit] = useState<{ open: boolean; initial: PricingTierRow | null }>({ open: false, initial: null });
  const reload = () => { void getPricingTiers(false).then(setItems); };
  useEffect(() => { void getPricingConfig().then(setConfig); reload(); }, []);
  if (!isSuperAdmin) return <Navigate to="/dashboard" />;
  const done = (e: string | null) => { if (e) toast.error(e); else reload(); };
  const onSave = async (t: PricingTierDraft) => { const e = await savePricingTier(t); if (e) return toast.error(e); setEdit({ open: false, initial: null }); toast.success("Guardado"); reload(); };
  const move = async (i: number, dir: -1 | 1) => {
    const a = items[i], b = items[i + dir]; if (!a || !b) return;
    await setTierFields(a.id, { display_order: b.displayOrder });
    done(await setTierFields(b.id, { display_order: a.displayOrder }));
  };
  return (
    <div className="space-y-6 p-4 md:p-8">
      <h1 className="font-display text-2xl font-bold text-foreground">Editor · Precios</h1>
      {config && <PricingConfigEditor config={config} />}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-foreground">Planes ({items.length})</h2>
        <button type="button" onClick={() => setEdit({ open: true, initial: null })} className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground"><Plus className="h-4 w-4" />Nuevo</button>
      </div>
      <div className="space-y-2">
        {items.map((t, i) => (
          <PricingListRow key={t.id} t={t} first={i === 0} last={i === items.length - 1}
            onMove={(d) => void move(i, d)} onToggleActive={(v) => void setTierFields(t.id, { is_active: v }).then(done)}
            onToggleRec={(v) => void setRecommended(t.id, v).then(done)}
            onEdit={() => setEdit({ open: true, initial: t })}
            onDelete={() => { if (window.confirm(`¿Eliminar "${t.nameEs}"?`)) void deletePricingTier(t.id).then(done); }} />
        ))}
      </div>
      <AddonsSection />
      {edit.open && <PricingDialog initial={edit.initial} onClose={() => setEdit({ open: false, initial: null })} onSave={onSave} />}
    </div>
  );
}
