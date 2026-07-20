import { useEffect, useState } from "react";
import { LucideIconPicker } from "@raisen-marketing/admin/LucideIconPicker";
import type { SocialLink, SocialLinkDraft } from "@raisen-marketing/data/footer.types";

const EMPTY: SocialLinkDraft = { platform: "", url: "", iconName: "Globe", displayOrder: 0, isActive: true };
const F = "w-full rounded-lg border border-border bg-background p-2 text-sm text-foreground";
const COMMON = ["Instagram", "Facebook", "LinkedIn", "YouTube", "TikTok", "X", "GitHub", "Website"];
const SUGGEST: Record<string, string> = { Instagram: "Camera", Facebook: "ThumbsUp", LinkedIn: "Briefcase", YouTube: "Play", TikTok: "Music", X: "AtSign", GitHub: "Code", Website: "Globe" };

// Crear/editar un link social del footer. Plataforma libre (o de la lista común, que auto-sugiere el ícono)
// + URL + ícono (LucideIconPicker, cualquier ícono del set compartido).
export function SocialLinkDialog({ initial, onClose, onSave }: { initial: SocialLink | null; onClose: () => void; onSave: (s: SocialLinkDraft) => void }) {
  const [d, setD] = useState<SocialLinkDraft>(EMPTY);
  useEffect(() => setD(initial ?? EMPTY), [initial]);
  const set = (p: Partial<SocialLinkDraft>) => setD((x) => ({ ...x, ...p }));
  const pickPlatform = (p: string) => set({ platform: p, iconName: SUGGEST[p] ?? d.iconName });
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-md space-y-3 overflow-y-auto rounded-xl border border-border bg-card p-5" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-lg font-bold text-foreground">{d.id ? "Editar" : "Nueva"} red social</h2>
        <input className={F} placeholder="Plataforma (ej. Instagram)" value={d.platform} onChange={(e) => set({ platform: e.target.value })} />
        <div className="flex flex-wrap gap-1">
          {COMMON.map((p) => <button key={p} type="button" onClick={() => pickPlatform(p)} className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground">{p}</button>)}
        </div>
        <input className={F} placeholder="https://…" value={d.url} onChange={(e) => set({ url: e.target.value })} />
        <LucideIconPicker value={d.iconName} onChange={(iconName) => set({ iconName })} />
        <label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={d.isActive} onChange={(e) => set({ isActive: e.target.checked })} />Activa</label>
        <div className="flex gap-2">
          <button type="button" disabled={!d.platform.trim() || !d.url.trim()} onClick={() => onSave(d)} className="flex-1 rounded-lg bg-primary py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">Guardar</button>
          <button type="button" onClick={onClose} className="rounded-lg bg-secondary px-4 py-2 text-sm text-foreground">Cancelar</button>
        </div>
      </div>
    </div>
  );
}
