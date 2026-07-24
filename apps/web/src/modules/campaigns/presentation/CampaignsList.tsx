import { useCallback, useEffect, useState } from "react";
import { Plus, Eye, Trash2, Globe, Copy, Archive } from "lucide-react";
import { listCampaignPages, publishPage, deletePage, duplicatePage, setArchived } from "@campaigns/infrastructure/campaigns-admin.repository";
import type { CampaignListItem, CampaignNav } from "@campaigns/domain/campaign.types";

// Lista de campañas del scope. `nav` provee el dominio a mostrar y las rutas del editor/inbox.
export function CampaignsList({ nav }: { nav: CampaignNav }) {
  const [rows, setRows] = useState<CampaignListItem[]>([]);
  const [showArch, setShowArch] = useState(false);
  const load = useCallback(async () => setRows(await listCampaignPages(showArch)), [showArch]);
  useEffect(() => { void load(); }, [load]);
  async function toggle(r: CampaignListItem) { await publishPage(r.id, !r.isPublished); void load(); }
  async function dup(r: CampaignListItem) { await duplicatePage(r.id); void load(); }
  async function arch(r: CampaignListItem) { await setArchived(r.id, !r.isArchived); void load(); }
  async function remove(r: CampaignListItem) {
    const warn = r.leads > 0 ? `\n\n⚠️ Tiene ${r.leads} leads. Al eliminarla quedan sin referencia de origen (no se borran).` : "";
    if (window.confirm(`¿Eliminar "${r.name}"?${warn}`)) { await deletePage(r.id); void load(); }
  }
  const ico = "rounded-lg border border-border p-1.5";
  return (
    <div className="space-y-4 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-xl font-bold text-foreground md:text-3xl">Campañas</h1>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 text-xs text-muted-foreground"><input type="checkbox" checked={showArch} onChange={(e) => setShowArch(e.target.checked)} /> Ver archivadas</label>
          <button type="button" onClick={() => nav.toEditor("new")} className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground"><Plus className="h-4 w-4" /> Nueva campaña</button>
        </div>
      </div>
      {rows.length === 0 ? <p className="text-sm text-muted-foreground">Sin campañas todavía.</p> : (
        <div className="space-y-2">{rows.map((r) => (
          <div key={r.id} className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card p-3 ${r.isArchived ? "opacity-60" : ""}`}>
            <div className="min-w-0">
              <button type="button" onClick={() => nav.toEditor(r.id)} className="font-bold text-foreground hover:underline">{r.name}{r.isArchived ? " · archivada" : ""}</button>
              <p className="truncate text-xs text-muted-foreground">{nav.host}/c/{r.slug} · {r.blocks} bloques · {r.visits} vis (30d) · {r.leads} leads{r.visits > 0 ? ` · ${((r.leads / r.visits) * 100).toFixed(1)}%` : ""}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${r.isPublished ? "bg-emerald-500/15 text-emerald-500" : "bg-secondary text-muted-foreground"}`}>{r.isPublished ? "Publicada" : "Borrador"}</span>
              <a href={`https://${nav.host}/c/${r.slug}?preview=true`} target="_blank" rel="noreferrer" className={ico} title="Ver / vista previa"><Eye className="h-4 w-4" /></a>
              <button type="button" onClick={() => void toggle(r)} className={ico} title="Publicar/despublicar"><Globe className="h-4 w-4" /></button>
              <button type="button" onClick={() => void dup(r)} className={ico} title="Duplicar"><Copy className="h-4 w-4" /></button>
              <button type="button" onClick={() => void arch(r)} className={ico} title={r.isArchived ? "Desarchivar" : "Archivar"}><Archive className={`h-4 w-4 ${r.isArchived ? "text-primary" : ""}`} /></button>
              <button type="button" onClick={() => void remove(r)} className={`${ico} text-red-500`} title="Eliminar"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}</div>
      )}
    </div>
  );
}
