import { useEffect, useState } from "react";
import { Navigate } from "@tanstack/react-router";
import { useToast } from "@shared/providers/toast-context";
import { useSuperAdmin } from "@shared/hooks/useSuperAdmin";
import { getFooter, saveFooter } from "@raisen-marketing/infrastructure/marketing-footer.repository";
import { SocialLinksEditor } from "@raisen-marketing/admin/SocialLinksEditor";
import type { FooterRow } from "@raisen-marketing/data/footer.types";

const F = "w-full rounded-lg border border-border bg-background p-2 text-sm text-foreground";

// Editor /web/footer (Super Admin): tagline + contacto + copyright con {year} (form único) + redes sociales
// en lista FLEXIBLE (tabla marketing_footer_social_links, CRUD propio). Gate is_superadmin.
export function FooterEditor() {
  const { isSuperAdmin } = useSuperAdmin();
  const toast = useToast();
  const [f, setF] = useState<FooterRow | null>(null);
  useEffect(() => { void getFooter().then(setF); }, []);
  if (!isSuperAdmin) return <Navigate to="/dashboard" />;
  if (!f) return <div className="p-8 text-sm text-muted-foreground">Cargando…</div>;
  const set = (p: Partial<FooterRow>) => setF((x) => ({ ...x!, ...p }));
  const save = async () => { const e = await saveFooter(f); if (e) toast.error(e); else toast.success("Footer guardado"); };
  return (
    <div className="max-w-2xl space-y-4 p-4 md:p-8">
      <h1 className="font-display text-2xl font-bold text-foreground">Editor · Footer</h1>
      <div className="grid grid-cols-2 gap-2">
        <input className={F} placeholder="Tagline ES" value={f.taglineEs} onChange={(e) => set({ taglineEs: e.target.value })} />
        <input className={F} placeholder="Tagline EN" value={f.taglineEn} onChange={(e) => set({ taglineEn: e.target.value })} />
        <input className={F} placeholder="Email de contacto" value={f.contactEmail ?? ""} onChange={(e) => set({ contactEmail: e.target.value })} />
        <input className={F} placeholder="Teléfono (opcional)" value={f.contactPhone ?? ""} onChange={(e) => set({ contactPhone: e.target.value })} />
      </div>
      <SocialLinksEditor />
      <p className="text-xs text-muted-foreground">Tip: usa <code>{"{year}"}</code> en el copyright — se reemplaza por el año actual.</p>
      <div className="grid grid-cols-2 gap-2">
        <input className={F} placeholder="Copyright ES" value={f.copyrightEs} onChange={(e) => set({ copyrightEs: e.target.value })} />
        <input className={F} placeholder="Copyright EN" value={f.copyrightEn} onChange={(e) => set({ copyrightEn: e.target.value })} />
      </div>
      <button type="button" onClick={() => void save()} className="rounded-lg bg-primary px-5 py-2 text-sm font-bold text-primary-foreground">Guardar</button>
    </div>
  );
}
