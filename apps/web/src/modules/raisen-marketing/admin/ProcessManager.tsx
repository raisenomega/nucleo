import { useEffect, useState } from "react";
import { Navigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useToast } from "@shared/providers/toast-context";
import { useSuperAdmin } from "@shared/hooks/useSuperAdmin";
import { getProcessSteps, getProcessConfig, saveProcessStep, deleteProcessStep, setStepFields } from "@raisen-marketing/infrastructure/marketing-process.repository";
import type { ProcessStepRow, ProcessConfig, ProcessStepDraft } from "@raisen-marketing/data/process.types";
import { ProcessDialog } from "@raisen-marketing/admin/ProcessDialog";
import { ProcessConfigEditor } from "@raisen-marketing/admin/ProcessConfigEditor";
import { ProcessListRow } from "@raisen-marketing/admin/ProcessListRow";

// Editor /web/proceso (Super Admin): config de sección + CRUD de pasos con reorder ↑↓ y toggle activo.
export function ProcessManager() {
  const { isSuperAdmin } = useSuperAdmin();
  const toast = useToast();
  const [config, setConfig] = useState<ProcessConfig | null>(null);
  const [items, setItems] = useState<ProcessStepRow[]>([]);
  const [edit, setEdit] = useState<{ open: boolean; initial: ProcessStepRow | null }>({ open: false, initial: null });
  const reload = () => { void getProcessSteps(false).then(setItems); };
  useEffect(() => { void getProcessConfig().then(setConfig); reload(); }, []);
  if (!isSuperAdmin) return <Navigate to="/dashboard" />;
  const done = (e: string | null) => { if (e) toast.error(e); else reload(); };
  const onSave = async (s: ProcessStepDraft) => { const e = await saveProcessStep(s); if (e) return toast.error(e); setEdit({ open: false, initial: null }); toast.success("Guardado"); reload(); };
  const move = async (i: number, dir: -1 | 1) => {
    const a = items[i], b = items[i + dir]; if (!a || !b) return;
    await setStepFields(a.id, { display_order: b.displayOrder });
    done(await setStepFields(b.id, { display_order: a.displayOrder }));
  };
  return (
    <div className="space-y-6 p-4 md:p-8">
      <h1 className="font-display text-2xl font-bold text-foreground">Editor · Proceso</h1>
      {config && <ProcessConfigEditor config={config} />}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-foreground">Pasos ({items.length})</h2>
        <button type="button" onClick={() => setEdit({ open: true, initial: null })} className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground"><Plus className="h-4 w-4" />Nuevo</button>
      </div>
      <div className="space-y-2">
        {items.map((s, i) => (
          <ProcessListRow key={s.id} s={s} first={i === 0} last={i === items.length - 1}
            onMove={(d) => void move(i, d)} onToggle={(v) => void setStepFields(s.id, { is_active: v }).then(done)}
            onEdit={() => setEdit({ open: true, initial: s })}
            onDelete={() => { if (window.confirm(`¿Eliminar "${s.titleEs}"?`)) void deleteProcessStep(s.id).then(done); }} />
        ))}
      </div>
      {edit.open && <ProcessDialog initial={edit.initial} onClose={() => setEdit({ open: false, initial: null })} onSave={onSave} />}
    </div>
  );
}
