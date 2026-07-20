import { useEffect, useState } from "react";
import { Navigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useToast } from "@shared/providers/toast-context";
import { useSuperAdmin } from "@shared/hooks/useSuperAdmin";
import { getLegalPages, saveLegalPage, deleteLegalPage, setLegalFields } from "@raisen-marketing/infrastructure/marketing-legal.repository";
import type { LegalPageRow, LegalDraft } from "@raisen-marketing/data/legal.types";
import { LegalDialog } from "@raisen-marketing/admin/LegalDialog";
import { LegalListRow } from "@raisen-marketing/admin/LegalListRow";

// Editor /web/legales (Super Admin): CRUD de páginas legales con reorder ↑↓ y toggle activa. El contenido
// (markdown) se edita en el dialog y se renderiza en la ruta pública /legal/{slug}.
export function LegalManager() {
  const { isSuperAdmin } = useSuperAdmin();
  const toast = useToast();
  const [items, setItems] = useState<LegalPageRow[]>([]);
  const [edit, setEdit] = useState<{ open: boolean; initial: LegalPageRow | null }>({ open: false, initial: null });
  const reload = () => { void getLegalPages().then(setItems); };
  useEffect(() => { reload(); }, []);
  if (!isSuperAdmin) return <Navigate to="/dashboard" />;
  const done = (e: string | null) => { if (e) toast.error(e); else reload(); };
  const onSave = async (d: LegalDraft) => { const e = await saveLegalPage(d); if (e) return toast.error(e); setEdit({ open: false, initial: null }); toast.success("Guardado"); reload(); };
  const move = async (i: number, dir: -1 | 1) => {
    const a = items[i], b = items[i + dir]; if (!a || !b) return;
    await setLegalFields(a.id, { display_order: b.displayOrder });
    done(await setLegalFields(b.id, { display_order: a.displayOrder }));
  };
  return (
    <div className="max-w-3xl space-y-6 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-foreground">Editor · Legales</h1>
        <button type="button" onClick={() => setEdit({ open: true, initial: null })} className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground"><Plus className="h-4 w-4" />Nueva</button>
      </div>
      <div className="space-y-2">
        {items.map((p, i) => (
          <LegalListRow key={p.id} p={p} first={i === 0} last={i === items.length - 1}
            onMove={(dir) => void move(i, dir)} onToggle={(v) => void setLegalFields(p.id, { is_active: v }).then(done)}
            onEdit={() => setEdit({ open: true, initial: p })}
            onDelete={() => { if (window.confirm(`¿Eliminar "${p.titleEs}"?`)) void deleteLegalPage(p.id).then(done); }} />
        ))}
      </div>
      {edit.open && <LegalDialog initial={edit.initial} onClose={() => setEdit({ open: false, initial: null })} onSave={onSave} />}
    </div>
  );
}
