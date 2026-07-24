import { useState } from "react";
import { upsertBlock } from "@campaigns/infrastructure/campaigns-admin.repository";
import type { CampaignBlock, BlockContent } from "@campaigns/domain/campaign.types";

// Campos por tipo (R1: hero/text/cta_banner). Cada campo edita una key del content_es (jsonb).
const FIELDS: Record<string, { key: string; label: string; area?: boolean }[]> = {
  hero: [{ key: "headline", label: "Headline" }, { key: "subtitle", label: "Subtítulo" }, { key: "cta_label", label: "CTA texto" }, { key: "cta_action", label: "CTA acción (#form o URL)" }, { key: "background_image_url", label: "Imagen de fondo (URL)" }],
  text: [{ key: "content", label: "Texto (una línea = un párrafo)", area: true }],
  cta_banner: [{ key: "headline", label: "Headline" }, { key: "cta_label", label: "CTA texto" }, { key: "cta_action", label: "CTA acción" }],
  form: [{ key: "title", label: "Título" }, { key: "subtitle", label: "Subtítulo" }, { key: "fields", label: "Campos (coma: name,email,phone,company,message)" }, { key: "cta_label", label: "Botón" }, { key: "success_message", label: "Mensaje de éxito" }, { key: "consent_text", label: "Consentimiento" }, { key: "redirect_url", label: "Redirect tras enviar (opcional)" }],
};

export function BlockDialog({ block, pageId, onClose, onSaved }: { block: CampaignBlock; pageId: string; onClose: () => void; onSaved: () => void }) {
  const [c, setC] = useState<BlockContent>(block.contentEs ?? {});
  const fields = FIELDS[block.blockType] ?? [];
  const val = (k: string) => (typeof c[k] === "string" ? (c[k] as string) : "");
  const inp = "mt-1 w-full rounded-lg border border-border bg-background p-2 text-sm";
  async function save() { await upsertBlock({ id: block.id, page_id: pageId, content_es: c }); onSaved(); }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-lg space-y-3 overflow-y-auto rounded-xl border border-border bg-card p-5" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-bold text-foreground">Editar bloque · {block.blockType}</h2>
        {fields.map((f) => (
          <label key={f.key} className="block text-xs text-muted-foreground">{f.label}
            {f.area
              ? <textarea className={inp} rows={4} value={val(f.key)} onChange={(e) => setC({ ...c, [f.key]: e.target.value })} />
              : <input className={inp} value={val(f.key)} onChange={(e) => setC({ ...c, [f.key]: e.target.value })} />}
          </label>
        ))}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-border px-3 py-2 text-sm">Cancelar</button>
          <button type="button" onClick={() => void save()} className="rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground">Guardar</button>
        </div>
      </div>
    </div>
  );
}
