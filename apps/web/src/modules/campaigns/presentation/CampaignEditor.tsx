import { useCallback, useEffect, useState } from "react";
import { getCampaignAdmin, upsertPage, publishPage } from "@campaigns/infrastructure/campaigns-admin.repository";
import { CampaignBlockList } from "@campaigns/presentation/CampaignBlockList";
import { CampaignPerformance } from "@campaigns/presentation/CampaignPerformance";
import type { CampaignNav } from "@campaigns/domain/campaign.types";

type Meta = { name: string; slug: string; seoTitle: string; seoDescription: string; confSubject: string; confBody: string };
const EMPTY: Meta = { name: "", slug: "", seoTitle: "", seoDescription: "", confSubject: "", confBody: "" };

// Editor de una campaña (superadmin o tenant, según `nav`). Metadata + vista previa + publicar + tabs contenido/rendimiento.
export function CampaignEditor({ id, nav }: { id: string; nav: CampaignNav }) {
  const isNew = id === "new";
  const [pageId, setPageId] = useState<string | null>(isNew ? null : id);
  const [published, setPublished] = useState(false);
  const [tab, setTab] = useState<"content" | "perf">("content");
  const [m, setM] = useState<Meta>(EMPTY);
  const load = useCallback(async () => {
    if (isNew) return;
    const d = await getCampaignAdmin(id);
    if (d) { setPublished(d.page.isPublished); setM({ name: d.page.name, slug: d.page.slug, seoTitle: d.page.seoTitle ?? "", seoDescription: d.page.seoDescription ?? "", confSubject: d.page.confirmationSubject ?? "", confBody: d.page.confirmationBody ?? "" }); }
  }, [id, isNew]);
  useEffect(() => { void load(); }, [load]);
  async function save() {
    const r = await upsertPage({ id: pageId, name: m.name, slug: m.slug, seo_title: m.seoTitle, seo_description: m.seoDescription, confirmation_subject: m.confSubject, confirmation_body: m.confBody });
    if (r.error) { window.alert(`Error: ${r.error}`); return; }
    if (isNew && r.id) nav.toEditor(r.id); else setPageId(r.id ?? pageId);
  }
  async function togglePub() { if (!pageId) return; await publishPage(pageId, !published); setPublished(!published); }
  const fld = "mt-1 w-full rounded-lg border border-border bg-background p-2 text-sm";
  const tabBtn = (k: "content" | "perf", l: string) => <button type="button" onClick={() => setTab(k)} className={`rounded-lg px-3 py-1.5 text-sm font-bold ${tab === k ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>{l}</button>;
  return (
    <div className="space-y-4 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-display text-xl font-bold text-foreground md:text-3xl">{isNew ? "Nueva campaña" : m.name || "Campaña"}</h1>
          {pageId && <p className="text-xs text-muted-foreground">URL: {nav.host}/c/{m.slug}</p>}
        </div>
        {pageId && <div className="flex gap-2">
          <a href={`https://${nav.host}/c/${m.slug}?preview=true`} target="_blank" rel="noreferrer" className="rounded-lg border border-border px-3 py-1.5 text-sm">Vista previa</a>
          <button type="button" onClick={() => void togglePub()} className="rounded-lg border border-border px-3 py-1.5 text-sm font-bold">{published ? "Despublicar" : "Publicar"}</button>
        </div>}
      </div>
      <div className="grid gap-3 rounded-lg border border-border bg-card p-4 md:grid-cols-2">
        <label className="text-xs text-muted-foreground">Nombre<input className={fld} value={m.name} onChange={(e) => setM({ ...m, name: e.target.value })} /></label>
        <label className="text-xs text-muted-foreground">Slug (minúsculas, guiones)<input className={fld} value={m.slug} onChange={(e) => setM({ ...m, slug: e.target.value })} /></label>
        <label className="text-xs text-muted-foreground md:col-span-2">SEO título<input className={fld} value={m.seoTitle} onChange={(e) => setM({ ...m, seoTitle: e.target.value })} /></label>
        <label className="text-xs text-muted-foreground md:col-span-2">SEO descripción<input className={fld} value={m.seoDescription} onChange={(e) => setM({ ...m, seoDescription: e.target.value })} /></label>
        <label className="text-xs text-muted-foreground md:col-span-2">Email confirmación · asunto (opcional)<input className={fld} value={m.confSubject} onChange={(e) => setM({ ...m, confSubject: e.target.value })} /></label>
        <label className="text-xs text-muted-foreground md:col-span-2">Email confirmación · cuerpo (opcional)<textarea className={fld} rows={2} value={m.confBody} onChange={(e) => setM({ ...m, confBody: e.target.value })} /></label>
        <button type="button" onClick={() => void save()} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground md:col-span-2">Guardar metadata</button>
      </div>
      {pageId && <><div className="flex gap-1">{tabBtn("content", "Contenido")}{tabBtn("perf", "Rendimiento")}</div>
        {tab === "content" ? <CampaignBlockList pageId={pageId} /> : <CampaignPerformance pageId={pageId} onViewLeads={nav.toLeads} />}</>}
    </div>
  );
}
