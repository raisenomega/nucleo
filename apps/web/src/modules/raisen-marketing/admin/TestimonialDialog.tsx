import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { MediaUploadField } from "@raisen-marketing/admin/MediaUploadField";
import type { TestimonialDraft, TestimonialRow } from "@raisen-marketing/data/testimonial.types";

const EMPTY: TestimonialDraft = { quoteEs: "", quoteEn: "", clientName: "", clientCompany: "", clientRole: "", avatarUrl: null, rating: 5, isActive: true, displayOrder: 0 };
const F = "w-full rounded-lg border border-border bg-background p-2 text-sm text-foreground";

// Modal crear/editar testimonio (bilingüe). Avatar reusa MediaUploadField (kind avatar, sube a avatars/,
// preview circular, fallback a iniciales en la landing). Rating = 5 estrellas clickeables.
export function TestimonialDialog({ initial, onClose, onSave }: { initial: TestimonialRow | null; onClose: () => void; onSave: (t: TestimonialDraft) => void }) {
  const [d, setD] = useState<TestimonialDraft>(EMPTY);
  useEffect(() => setD(initial ?? EMPTY), [initial]);
  const set = (p: Partial<TestimonialDraft>) => setD((x) => ({ ...x, ...p }));
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-lg space-y-3 overflow-y-auto rounded-xl border border-border bg-card p-5" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-lg font-bold text-foreground">{d.id ? "Editar" : "Nuevo"} testimonio</h2>
        <textarea className={F} rows={2} placeholder="Cita ES" value={d.quoteEs} onChange={(e) => set({ quoteEs: e.target.value })} />
        <textarea className={F} rows={2} placeholder="Cita EN" value={d.quoteEn} onChange={(e) => set({ quoteEn: e.target.value })} />
        <div className="grid grid-cols-3 gap-2">
          <input className={F} placeholder="Nombre" value={d.clientName} onChange={(e) => set({ clientName: e.target.value })} />
          <input className={F} placeholder="Empresa" value={d.clientCompany ?? ""} onChange={(e) => set({ clientCompany: e.target.value })} />
          <input className={F} placeholder="Rol" value={d.clientRole ?? ""} onChange={(e) => set({ clientRole: e.target.value })} />
        </div>
        <MediaUploadField label="Avatar (opcional)" kind="avatar" url={d.avatarUrl} accept="image/jpeg,image/png,image/webp" onChange={(u) => set({ avatarUrl: u })} />
        <div className="flex items-center gap-3 text-sm text-foreground">
          <span>Rating</span>
          {Array.from({ length: 5 }).map((_, i) => (
            <button key={i} type="button" aria-label={`${i + 1} estrellas`} onClick={() => set({ rating: i + 1 })}><Star size={20} className={i < d.rating ? "fill-primary text-primary" : "text-muted-foreground"} /></button>
          ))}
          <label className="ml-auto flex items-center gap-2"><input type="checkbox" checked={d.isActive} onChange={(e) => set({ isActive: e.target.checked })} />Activo</label>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => onSave(d)} className="flex-1 rounded-lg bg-primary py-2 text-sm font-bold text-primary-foreground">Guardar</button>
          <button type="button" onClick={onClose} className="rounded-lg bg-secondary px-4 py-2 text-sm text-foreground">Cancelar</button>
        </div>
      </div>
    </div>
  );
}
