import { X, Plus } from "lucide-react";
import type { Json } from "@landing/domain/service-page-admin.types";

const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
const KINDS = ["text", "tel", "email", "textarea", "select", "multi_select"];
const optsToText = (o: Json[]) => o.map((x) => `${x.value}|${x.label_es}|${x.label_en ?? x.label_es}`).join("\n");
const textToOpts = (s: string): Json[] => s.split("\n").filter((l) => l.trim()).map((l) => { const [v, es, en] = l.split("|"); return { value: (v ?? "").trim(), label_es: (es ?? "").trim(), label_en: (en ?? es ?? "").trim() }; });

export function RequestFormEditor({ form, onChange }: { form: Json; onChange: (f: Json) => void }) {
  const fields = (Array.isArray(form.fields) ? form.fields : []) as Json[];
  const setF = (k: string, v: unknown) => onChange({ ...form, [k]: v });
  const setFields = (fs: Json[]) => onChange({ ...form, fields: fs });
  const upd = (i: number, patch: Json) => setFields(fields.map((f, k) => (k === i ? { ...f, ...patch } : f)));
  const inp = (k: string, ph: string) => <input value={(form[k] as string) ?? ""} onChange={(e) => setF(k, e.target.value)} placeholder={ph} className={fld} />;
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">{inp("title_es", "Título ES")}{inp("title_en", "Title EN")}</div>
      <div className="grid grid-cols-2 gap-2">{inp("submit_label_es", "Submit ES")}{inp("success_message_es", "Éxito msg ES")}</div>
      {fields.map((f, i) => (
        <div key={i} className="space-y-2 rounded-lg border border-border p-2">
          <div className="flex items-center gap-2">
            <select value={(f.kind as string) ?? "text"} onChange={(e) => upd(i, { kind: e.target.value })} className={fld}>{KINDS.map((k) => <option key={k} value={k}>{k}</option>)}</select>
            <input value={(f.name as string) ?? ""} onChange={(e) => upd(i, { name: e.target.value })} placeholder="name" className={`${fld} font-mono`} />
            <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={f.required === true} onChange={(e) => upd(i, { required: e.target.checked })} />req</label>
            <button type="button" onClick={() => setFields(fields.filter((_, k) => k !== i))}><X className="h-4 w-4 text-destructive" /></button>
          </div>
          <div className="grid grid-cols-2 gap-2"><input value={(f.label_es as string) ?? ""} onChange={(e) => upd(i, { label_es: e.target.value })} placeholder="Label ES" className={fld} /><input value={(f.label_en as string) ?? ""} onChange={(e) => upd(i, { label_en: e.target.value })} placeholder="Label EN" className={fld} /></div>
          {(f.kind === "select" || f.kind === "multi_select") && <textarea value={optsToText((f.options as Json[]) ?? [])} onChange={(e) => upd(i, { options: textToOpts(e.target.value) })} placeholder="value|label ES|label EN" rows={3} className={`${fld} font-mono`} />}
        </div>))}
      {fields.length < 15 && <button type="button" onClick={() => setFields([...fields, { kind: "text", name: "", label_es: "", label_en: "", required: false }])} className="flex items-center gap-1 text-sm text-foreground"><Plus className="h-4 w-4" /> +</button>}
    </div>
  );
}
