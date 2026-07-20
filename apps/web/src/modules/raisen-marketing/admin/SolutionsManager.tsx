import { useEffect, useState } from "react";
import { Navigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useToast } from "@shared/providers/toast-context";
import { useSuperAdmin } from "@shared/hooks/useSuperAdmin";
import { getSolutions, getSolutionsConfig, saveSolution, deleteSolution, setSolutionFields } from "@raisen-marketing/infrastructure/marketing-solutions.repository";
import type { SolutionRow, SolutionsConfig, SolutionDraft } from "@raisen-marketing/data/solution.types";
import { SolutionDialog } from "@raisen-marketing/admin/SolutionDialog";
import { SolutionsConfigEditor } from "@raisen-marketing/admin/SolutionsConfigEditor";
import { SolutionListRow } from "@raisen-marketing/admin/SolutionListRow";

// Editor /web/soluciones (Super Admin): config de sección + CRUD de bloques con reorder ↑↓, toggle activo y
// highlight EXCLUSIVO + badge (en el dialog; el repo desmarca los demás al guardar highlight=true).
export function SolutionsManager() {
  const { isSuperAdmin } = useSuperAdmin();
  const toast = useToast();
  const [config, setConfig] = useState<SolutionsConfig | null>(null);
  const [items, setItems] = useState<SolutionRow[]>([]);
  const [edit, setEdit] = useState<{ open: boolean; initial: SolutionRow | null }>({ open: false, initial: null });
  const reload = () => { void getSolutions(false).then(setItems); };
  useEffect(() => { void getSolutionsConfig().then(setConfig); reload(); }, []);
  if (!isSuperAdmin) return <Navigate to="/dashboard" />;
  const done = (e: string | null) => { if (e) toast.error(e); else reload(); };
  const onSave = async (s: SolutionDraft) => { const e = await saveSolution(s); if (e) return toast.error(e); setEdit({ open: false, initial: null }); toast.success("Guardado"); reload(); };
  const move = async (i: number, dir: -1 | 1) => {
    const a = items[i], b = items[i + dir]; if (!a || !b) return;
    await setSolutionFields(a.id, { display_order: b.displayOrder });
    done(await setSolutionFields(b.id, { display_order: a.displayOrder }));
  };
  return (
    <div className="space-y-6 p-4 md:p-8">
      <h1 className="font-display text-2xl font-bold text-foreground">Editor · Soluciones</h1>
      {config && <SolutionsConfigEditor config={config} />}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-foreground">Bloques ({items.length})</h2>
        <button type="button" onClick={() => setEdit({ open: true, initial: null })} className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground"><Plus className="h-4 w-4" />Nuevo</button>
      </div>
      <div className="space-y-2">
        {items.map((s, i) => (
          <SolutionListRow key={s.id} s={s} first={i === 0} last={i === items.length - 1}
            onMove={(d) => void move(i, d)} onToggle={(v) => void setSolutionFields(s.id, { is_active: v }).then(done)}
            onEdit={() => setEdit({ open: true, initial: s })}
            onDelete={() => { if (window.confirm(`¿Eliminar "${s.titleEs}"?`)) void deleteSolution(s.id).then(done); }} />
        ))}
      </div>
      {edit.open && <SolutionDialog initial={edit.initial} onClose={() => setEdit({ open: false, initial: null })} onSave={onSave} />}
    </div>
  );
}
