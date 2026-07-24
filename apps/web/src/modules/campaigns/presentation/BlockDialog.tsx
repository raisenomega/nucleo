import { useState } from "react";
import { upsertBlock } from "@campaigns/infrastructure/campaigns-admin.repository";
import { SCHEMAS } from "@campaigns/presentation/block-schemas";
import { BlockArrayEditor } from "@campaigns/presentation/BlockArrayEditor";
import type { CampaignBlock, BlockContent } from "@campaigns/domain/campaign.types";

// Editor de un bloque (los 14 tipos). Lee el esquema de block-schemas: campos simples + (si aplica) editor de array.
export function BlockDialog({ block, pageId, onClose, onSaved }: { block: CampaignBlock; pageId: string; onClose: () => void; onSaved: () => void }) {
  const [c, setC] = useState<BlockContent>(block.contentEs ?? {});
  const schema = SCHEMAS[block.blockType] ?? { simple: [] };
  const val = (k: string) => { const v = c[k]; return v == null ? "" : typeof v === "boolean" ? (v ? "1" : "") : String(v); };
  const set = (k: string, v: unknown) => setC({ ...c, [k]: v });
  const inp = "mt-1 w-full rounded-lg border border-border bg-background p-2 text-sm";
  async function save() { await upsertBlock({ id: block.id, page_id: pageId, content_es: c }); onSaved(); }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-lg space-y-3 overflow-y-auto rounded-xl border border-border bg-card p-5" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-bold text-foreground">Editar bloque · {block.blockType}</h2>
        {schema.simple.map((f) => (
          <label key={f.key} className="block text-xs text-muted-foreground">{f.label}
            {f.kind === "bool" ? <input type="checkbox" checked={val(f.key) === "1"} onChange={(e) => set(f.key, e.target.checked ? "1" : "")} className="ml-2 align-middle" />
              : f.kind === "area" ? <textarea className={inp} rows={4} value={val(f.key)} onChange={(e) => set(f.key, e.target.value)} />
              : <input className={inp} value={val(f.key)} onChange={(e) => set(f.key, e.target.value)} />}
          </label>
        ))}
        {schema.array && (
          <div><p className="mb-1 text-xs font-bold text-muted-foreground">{schema.array.itemLabel}s</p>
            <BlockArrayEditor spec={schema.array} items={(c[schema.array.key] as unknown[]) ?? []} onChange={(v) => set(schema.array!.key, v)} />
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-border px-3 py-2 text-sm">Cancelar</button>
          <button type="button" onClick={() => void save()} className="rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground">Guardar</button>
        </div>
      </div>
    </div>
  );
}
