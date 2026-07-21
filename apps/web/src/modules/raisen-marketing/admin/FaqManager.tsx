import { useEffect, useState } from "react";
import { Navigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useToast } from "@shared/providers/toast-context";
import { useSuperAdmin } from "@shared/hooks/useSuperAdmin";
import { getFaqs, getFaqConfig, saveFaq, deleteFaq, setFaqFields } from "@raisen-marketing/infrastructure/marketing-faq.repository";
import type { FaqRow, FaqConfig, FaqDraft } from "@raisen-marketing/data/faq.types";
import { FaqDialog } from "@raisen-marketing/admin/FaqDialog";
import { FaqConfigEditor } from "@raisen-marketing/admin/FaqConfigEditor";
import { FaqListRow } from "@raisen-marketing/admin/FaqListRow";

// Editor /web/faq (Super Admin): config de sección + CRUD de preguntas con reorder ↑↓ y toggle activa.
// Lo que se edita aquí alimenta A LA VEZ el acordeón visible y el JSON-LD FAQPage.
export function FaqManager() {
  const { isSuperAdmin } = useSuperAdmin();
  const toast = useToast();
  const [config, setConfig] = useState<FaqConfig | null>(null);
  const [items, setItems] = useState<FaqRow[]>([]);
  const [edit, setEdit] = useState<{ open: boolean; initial: FaqRow | null }>({ open: false, initial: null });
  const reload = () => { void getFaqs(false).then(setItems); };
  useEffect(() => { void getFaqConfig().then(setConfig); reload(); }, []);
  if (!isSuperAdmin) return <Navigate to="/dashboard" />;
  const done = (e: string | null) => { if (e) toast.error(e); else reload(); };
  const onSave = async (f: FaqDraft) => {
    const next = f.id ? f : { ...f, displayOrder: items.length + 1 };
    const e = await saveFaq(next);
    if (e) return toast.error(e);
    setEdit({ open: false, initial: null }); toast.success("Guardado"); reload();
  };
  const move = async (i: number, dir: -1 | 1) => {
    const a = items[i], b = items[i + dir]; if (!a || !b) return;
    await setFaqFields(a.id, { display_order: b.displayOrder });
    done(await setFaqFields(b.id, { display_order: a.displayOrder }));
  };
  return (
    <div className="space-y-6 p-4 md:p-8">
      <h1 className="font-display text-2xl font-bold text-foreground">Editor · Preguntas frecuentes</h1>
      <p className="text-sm text-muted-foreground">Estas preguntas se muestran en la landing Y se publican como datos estructurados (FAQPage) para Google y los asistentes IA.</p>
      {config && <FaqConfigEditor config={config} />}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-foreground">Preguntas ({items.length})</h2>
        <button type="button" onClick={() => setEdit({ open: true, initial: null })} className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground"><Plus className="h-4 w-4" />Nueva</button>
      </div>
      <div className="space-y-2">
        {items.map((f, i) => (
          <FaqListRow key={f.id} f={f} first={i === 0} last={i === items.length - 1}
            onMove={(d) => void move(i, d)} onToggleActive={(v) => void setFaqFields(f.id, { is_active: v }).then(done)}
            onEdit={() => setEdit({ open: true, initial: f })}
            onDelete={() => { if (window.confirm(`¿Eliminar "${f.questionEs}"?`)) void deleteFaq(f.id).then(done); }} />
        ))}
      </div>
      {edit.open && <FaqDialog initial={edit.initial} onClose={() => setEdit({ open: false, initial: null })} onSave={onSave} />}
    </div>
  );
}
