import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Plus, Eye, Trash2, Globe } from "lucide-react";
import { listCampaignPages, publishPage, deletePage } from "@campaigns/infrastructure/campaigns-admin.repository";
import type { CampaignListItem } from "@campaigns/domain/campaign.types";

// Lista de campañas del superadmin (SITIO WEB). URL pública visible por fila; acciones editar/preview/publicar/eliminar.
export function CampaignsList() {
  const [rows, setRows] = useState<CampaignListItem[]>([]);
  const load = useCallback(async () => setRows(await listCampaignPages()), []);
  useEffect(() => { void load(); }, [load]);
  async function toggle(r: CampaignListItem) { await publishPage(r.id, !r.isPublished); void load(); }
  async function remove(r: CampaignListItem) { if (window.confirm(`¿Eliminar "${r.name}"?`)) { await deletePage(r.id); void load(); } }
  return (
    <div className="space-y-4 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold text-foreground md:text-3xl">Campañas</h1>
        <Link to="/web/campanas/$id" params={{ id: "new" }} className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground"><Plus className="h-4 w-4" /> Nueva campaña</Link>
      </div>
      {rows.length === 0 ? <p className="text-sm text-muted-foreground">Sin campañas todavía.</p> : (
        <div className="space-y-2">{rows.map((r) => (
          <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card p-3">
            <div className="min-w-0">
              <Link to="/web/campanas/$id" params={{ id: r.id }} className="font-bold text-foreground hover:underline">{r.name}</Link>
              <p className="truncate text-xs text-muted-foreground">nucleoraisen.com/c/{r.slug} · {r.blocks} bloques · {r.visits} vis (30d) · {r.leads} leads{r.visits > 0 ? ` · ${((r.leads / r.visits) * 100).toFixed(1)}%` : ""}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${r.isPublished ? "bg-emerald-500/15 text-emerald-500" : "bg-secondary text-muted-foreground"}`}>{r.isPublished ? "Publicada" : "Borrador"}</span>
              <a href={`/c/${r.slug}?preview=true`} target="_blank" rel="noreferrer" className="rounded-lg border border-border p-1.5" title="Vista previa"><Eye className="h-4 w-4" /></a>
              <button type="button" onClick={() => void toggle(r)} className="rounded-lg border border-border p-1.5" title="Publicar/despublicar"><Globe className="h-4 w-4" /></button>
              <button type="button" onClick={() => void remove(r)} className="rounded-lg border border-border p-1.5 text-red-500" title="Eliminar"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}</div>
      )}
    </div>
  );
}
