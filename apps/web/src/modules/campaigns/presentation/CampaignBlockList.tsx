import { useCallback, useEffect, useState } from "react";
import { ChevronUp, ChevronDown, Plus, Trash2, Eye, EyeOff, Pencil } from "lucide-react";
import { getCampaignAdmin, deleteBlock, reorderBlocks, upsertBlock } from "@campaigns/infrastructure/campaigns-admin.repository";
import { BlockDialog } from "@campaigns/presentation/BlockDialog";
import type { CampaignBlock, BlockType } from "@campaigns/domain/campaign.types";

// R1: solo se pueden AGREGAR los 3 tipos implementados. Reorden con ↑↓ (mismo patrón del CMS comercial).
const ADDABLE: { type: BlockType; label: string }[] = [{ type: "hero", label: "Hero" }, { type: "text", label: "Texto" }, { type: "cta_banner", label: "CTA" }, { type: "form", label: "Formulario" }];

export function CampaignBlockList({ pageId }: { pageId: string }) {
  const [blocks, setBlocks] = useState<CampaignBlock[]>([]);
  const [edit, setEdit] = useState<CampaignBlock | null>(null);
  const load = useCallback(async () => { const d = await getCampaignAdmin(pageId); setBlocks(d?.blocks ?? []); }, [pageId]);
  useEffect(() => { void load(); }, [load]);
  async function move(i: number, dir: -1 | 1) {
    const j = i + dir; if (j < 0 || j >= blocks.length) return;
    const ids = blocks.map((b) => b.id); const t = ids[i]!; ids[i] = ids[j]!; ids[j] = t;
    await reorderBlocks(pageId, ids); void load();
  }
  async function add(type: BlockType) { await upsertBlock({ page_id: pageId, block_type: type, display_order: blocks.length, content_es: {} }); void load(); }
  async function toggle(b: CampaignBlock) { await upsertBlock({ id: b.id, page_id: pageId, is_visible: !b.isVisible }); void load(); }
  async function remove(b: CampaignBlock) { await deleteBlock(b.id); void load(); }
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">{ADDABLE.map((a) => <button key={a.type} type="button" onClick={() => void add(a.type)} className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs"><Plus className="h-3 w-3" />{a.label}</button>)}</div>
      {blocks.map((b, i) => (
        <div key={b.id} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card p-2">
          <span className="text-sm font-bold text-foreground">{i + 1}. {b.blockType}</span>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => void move(i, -1)} className="p-1" title="Subir"><ChevronUp className="h-4 w-4" /></button>
            <button type="button" onClick={() => void move(i, 1)} className="p-1" title="Bajar"><ChevronDown className="h-4 w-4" /></button>
            <button type="button" onClick={() => setEdit(b)} className="p-1" title="Editar"><Pencil className="h-4 w-4" /></button>
            <button type="button" onClick={() => void toggle(b)} className="p-1" title="Visible">{b.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}</button>
            <button type="button" onClick={() => void remove(b)} className="p-1 text-red-500" title="Eliminar"><Trash2 className="h-4 w-4" /></button>
          </div>
        </div>
      ))}
      {edit && <BlockDialog block={edit} pageId={pageId} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); void load(); }} />}
    </div>
  );
}
