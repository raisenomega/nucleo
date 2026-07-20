import { useEffect, useState } from "react";
import { Navigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useToast } from "@shared/providers/toast-context";
import { useSuperAdmin } from "@shared/hooks/useSuperAdmin";
import { getFeatures, getFeaturesConfig, saveFeature, deleteFeature, setFeatureFields } from "@raisen-marketing/infrastructure/marketing-features.repository";
import type { MarketingFeatureRow, FeaturesConfig, FeatureDraft } from "@raisen-marketing/data/feature.types";
import { FeatureDialog } from "@raisen-marketing/admin/FeatureDialog";
import { FeaturesConfigEditor } from "@raisen-marketing/admin/FeaturesConfigEditor";
import { FeatureListRow } from "@raisen-marketing/admin/FeatureListRow";

// Editor /web/features (Super Admin): config de sección + CRUD de features con reorder ↑↓ y toggle activo.
export function FeaturesManager() {
  const { isSuperAdmin } = useSuperAdmin();
  const toast = useToast();
  const [config, setConfig] = useState<FeaturesConfig | null>(null);
  const [items, setItems] = useState<MarketingFeatureRow[]>([]);
  const [edit, setEdit] = useState<{ open: boolean; initial: MarketingFeatureRow | null }>({ open: false, initial: null });
  const reload = () => { void getFeatures(false).then(setItems); };
  useEffect(() => { void getFeaturesConfig().then(setConfig); reload(); }, []);
  if (!isSuperAdmin) return <Navigate to="/dashboard" />;
  const done = (e: string | null) => { if (e) toast.error(e); else reload(); };
  const onSave = async (f: FeatureDraft) => { const e = await saveFeature(f); if (e) return toast.error(e); setEdit({ open: false, initial: null }); toast.success("Guardado"); reload(); };
  const move = async (i: number, dir: -1 | 1) => {
    const a = items[i], b = items[i + dir]; if (!a || !b) return;
    await setFeatureFields(a.id, { display_order: b.displayOrder });
    done(await setFeatureFields(b.id, { display_order: a.displayOrder }));
  };
  return (
    <div className="space-y-6 p-4 md:p-8">
      <h1 className="font-display text-2xl font-bold text-foreground">Editor · Features</h1>
      {config && <FeaturesConfigEditor config={config} />}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-foreground">Features ({items.length})</h2>
        <button type="button" onClick={() => setEdit({ open: true, initial: null })} className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground"><Plus className="h-4 w-4" />Nueva</button>
      </div>
      <div className="space-y-2">
        {items.map((f, i) => (
          <FeatureListRow key={f.id} f={f} first={i === 0} last={i === items.length - 1}
            onMove={(d) => void move(i, d)} onToggle={(v) => void setFeatureFields(f.id, { is_active: v }).then(done)}
            onEdit={() => setEdit({ open: true, initial: f })}
            onDelete={() => { if (window.confirm(`¿Eliminar "${f.titleEs}"?`)) void deleteFeature(f.id).then(done); }} />
        ))}
      </div>
      {edit.open && <FeatureDialog initial={edit.initial} onClose={() => setEdit({ open: false, initial: null })} onSave={onSave} />}
    </div>
  );
}
