import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { useToast } from "@shared/providers/toast-context";
import { getSocialLinks, saveSocialLink, deleteSocialLink, setSocialFields } from "@raisen-marketing/infrastructure/marketing-social.repository";
import { socialIcon } from "@raisen-marketing/components/social-icons";
import type { SocialLink, SocialLinkDraft } from "@raisen-marketing/data/footer.types";
import { SocialLinkDialog } from "@raisen-marketing/admin/SocialLinkDialog";

// Redes del footer (tabla flexible): CRUD + reorder ↑↓ + toggle activa. Autocontenida.
export function SocialLinksEditor() {
  const toast = useToast();
  const [items, setItems] = useState<SocialLink[]>([]);
  const [edit, setEdit] = useState<{ open: boolean; initial: SocialLink | null }>({ open: false, initial: null });
  const reload = () => { void getSocialLinks(false).then(setItems); };
  useEffect(() => { reload(); }, []);
  const done = (e: string | null) => { if (e) toast.error(e); else reload(); };
  const onSave = async (s: SocialLinkDraft) => { const e = await saveSocialLink(s); if (e) return toast.error(e); setEdit({ open: false, initial: null }); toast.success("Guardado"); reload(); };
  const move = async (i: number, dir: -1 | 1) => {
    const a = items[i], b = items[i + dir]; if (!a || !b) return;
    await setSocialFields(a.id, { display_order: b.displayOrder });
    done(await setSocialFields(b.id, { display_order: a.displayOrder }));
  };
  return (
    <div className="space-y-2 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-foreground">Redes sociales ({items.length})</h2>
        <button type="button" onClick={() => setEdit({ open: true, initial: null })} className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground"><Plus className="h-4 w-4" />Nueva</button>
      </div>
      {items.length === 0 && <p className="text-xs text-muted-foreground">Sin redes. Agrega la primera.</p>}
      {items.map((s, i) => {
        const Icon = socialIcon(s.iconName, s.platform);
        return (
          <div key={s.id} className="flex items-center gap-3 rounded-lg border border-border p-2">
            <Icon className="h-4 w-4 shrink-0 text-primary" />
            <div className="min-w-0 flex-1"><p className="truncate text-sm text-foreground">{s.platform}</p><p className="truncate text-xs text-muted-foreground">{s.url}</p></div>
            <button type="button" onClick={() => void move(i, -1)} disabled={i === 0} aria-label="subir" className="rounded p-1 text-muted-foreground disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
            <button type="button" onClick={() => void move(i, 1)} disabled={i === items.length - 1} aria-label="bajar" className="rounded p-1 text-muted-foreground disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
            <label className="flex items-center gap-1 text-xs text-muted-foreground"><input type="checkbox" checked={s.isActive} onChange={(e) => void setSocialFields(s.id, { is_active: e.target.checked }).then(done)} />activa</label>
            <button type="button" onClick={() => setEdit({ open: true, initial: s })} aria-label="editar" className="rounded p-1 text-muted-foreground hover:text-foreground"><Pencil className="h-4 w-4" /></button>
            <button type="button" onClick={() => { if (window.confirm(`¿Eliminar "${s.platform}"?`)) void deleteSocialLink(s.id).then(done); }} aria-label="eliminar" className="rounded p-1 text-destructive"><Trash2 className="h-4 w-4" /></button>
          </div>
        );
      })}
      {edit.open && <SocialLinkDialog initial={edit.initial} onClose={() => setEdit({ open: false, initial: null })} onSave={onSave} />}
    </div>
  );
}
