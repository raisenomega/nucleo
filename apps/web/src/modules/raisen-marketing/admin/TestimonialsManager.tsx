import { useEffect, useState } from "react";
import { Navigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useToast } from "@shared/providers/toast-context";
import { useSuperAdmin } from "@shared/hooks/useSuperAdmin";
import { getTestimonials, getTestimonialsConfig, saveTestimonial, deleteTestimonial, setTestimonialFields } from "@raisen-marketing/infrastructure/marketing-testimonials.repository";
import type { TestimonialRow, TestimonialsConfig, TestimonialDraft } from "@raisen-marketing/data/testimonial.types";
import { TestimonialDialog } from "@raisen-marketing/admin/TestimonialDialog";
import { TestimonialsConfigEditor } from "@raisen-marketing/admin/TestimonialsConfigEditor";
import { TestimonialListRow } from "@raisen-marketing/admin/TestimonialListRow";

// Editor /web/testimonios (Super Admin): config de sección + CRUD de testimonios con reorder ↑↓, toggle
// activo y avatar upload (en el dialog). Avatares en marketing-media/avatars.
export function TestimonialsManager() {
  const { isSuperAdmin } = useSuperAdmin();
  const toast = useToast();
  const [config, setConfig] = useState<TestimonialsConfig | null>(null);
  const [items, setItems] = useState<TestimonialRow[]>([]);
  const [edit, setEdit] = useState<{ open: boolean; initial: TestimonialRow | null }>({ open: false, initial: null });
  const reload = () => { void getTestimonials(false).then(setItems); };
  useEffect(() => { void getTestimonialsConfig().then(setConfig); reload(); }, []);
  if (!isSuperAdmin) return <Navigate to="/dashboard" />;
  const done = (e: string | null) => { if (e) toast.error(e); else reload(); };
  const onSave = async (t: TestimonialDraft) => { const e = await saveTestimonial(t); if (e) return toast.error(e); setEdit({ open: false, initial: null }); toast.success("Guardado"); reload(); };
  const move = async (i: number, dir: -1 | 1) => {
    const a = items[i], b = items[i + dir]; if (!a || !b) return;
    await setTestimonialFields(a.id, { display_order: b.displayOrder });
    done(await setTestimonialFields(b.id, { display_order: a.displayOrder }));
  };
  return (
    <div className="space-y-6 p-4 md:p-8">
      <h1 className="font-display text-2xl font-bold text-foreground">Editor · Testimonios</h1>
      {config && <TestimonialsConfigEditor config={config} />}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-foreground">Testimonios ({items.length})</h2>
        <button type="button" onClick={() => setEdit({ open: true, initial: null })} className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground"><Plus className="h-4 w-4" />Nuevo</button>
      </div>
      <div className="space-y-2">
        {items.map((t, i) => (
          <TestimonialListRow key={t.id} t={t} first={i === 0} last={i === items.length - 1}
            onMove={(d) => void move(i, d)} onToggle={(v) => void setTestimonialFields(t.id, { is_active: v }).then(done)}
            onEdit={() => setEdit({ open: true, initial: t })}
            onDelete={() => { if (window.confirm(`¿Eliminar el testimonio de "${t.clientName}"?`)) void deleteTestimonial(t.id).then(done); }} />
        ))}
      </div>
      {edit.open && <TestimonialDialog initial={edit.initial} onClose={() => setEdit({ open: false, initial: null })} onSave={onSave} />}
    </div>
  );
}
