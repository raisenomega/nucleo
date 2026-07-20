import { useEffect, useState } from "react";
import { Navigate } from "@tanstack/react-router";
import { ArrowUp, ArrowDown, Lock } from "lucide-react";
import { useToast } from "@shared/providers/toast-context";
import { useSuperAdmin } from "@shared/hooks/useSuperAdmin";
import { getSections, setSectionFields } from "@raisen-marketing/infrastructure/marketing-sections.repository";
import type { SectionRow } from "@raisen-marketing/data/section.types";

// Editor /web/secciones (Super Admin): togglea visibilidad + reordena ↑↓ las secciones de la landing (keys
// fijos, sin agregar/eliminar). Guardado INMEDIATO por acción. El Hero es no-toggleable (siempre visible).
export function SectionsManager() {
  const { isSuperAdmin } = useSuperAdmin();
  const toast = useToast();
  const [items, setItems] = useState<SectionRow[]>([]);
  const reload = () => { void getSections().then(setItems); };
  useEffect(() => { reload(); }, []);
  if (!isSuperAdmin) return <Navigate to="/dashboard" />;
  const done = (e: string | null) => { if (e) toast.error(e); else reload(); };
  const move = async (i: number, dir: -1 | 1) => {
    const a = items[i], b = items[i + dir]; if (!a || !b) return;
    await setSectionFields(a.id, { display_order: b.order });
    done(await setSectionFields(b.id, { display_order: a.order }));
  };
  return (
    <div className="max-w-2xl space-y-4 p-4 md:p-8">
      <h1 className="font-display text-2xl font-bold text-foreground">Editor · Secciones</h1>
      <p className="text-sm text-muted-foreground">Activa/oculta y reordena las secciones de la landing. El Hero siempre es visible.</p>
      <div className="space-y-2">
        {items.map((s, i) => (
          <div key={s.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
            <span className="w-6 text-xs text-muted-foreground">{s.order}</span>
            <span className="flex-1 text-sm font-medium text-foreground">{s.labelEs} <span className="text-muted-foreground">/ {s.labelEn}</span></span>
            <button type="button" onClick={() => void move(i, -1)} disabled={i === 0} aria-label="subir" className="rounded p-1 text-muted-foreground disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
            <button type="button" onClick={() => void move(i, 1)} disabled={i === items.length - 1} aria-label="bajar" className="rounded p-1 text-muted-foreground disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
            {s.key === "hero"
              ? <span className="flex items-center gap-1 text-xs text-muted-foreground"><Lock className="h-3 w-3" />visible</span>
              : <label className="flex items-center gap-1 text-xs text-muted-foreground"><input type="checkbox" checked={s.isVisible} onChange={(e) => void setSectionFields(s.id, { is_visible: e.target.checked }).then(done)} />visible</label>}
          </div>
        ))}
      </div>
    </div>
  );
}
