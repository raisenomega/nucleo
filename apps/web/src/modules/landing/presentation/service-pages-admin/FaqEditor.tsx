import { X, Plus, ChevronUp, ChevronDown } from "lucide-react";
import type { Json } from "@landing/domain/service-page-admin.types";

const MAX = 20;
const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
export function FaqEditor({ faq, onChange }: { faq: Json[]; onChange: (f: Json[]) => void }) {
  const upd = (i: number, patch: Json) => onChange(faq.map((q, k) => (k === i ? { ...q, ...patch } : q)));
  const move = (i: number, d: number) => { const a = [...faq]; const j = i + d; if (j < 0 || j >= a.length) return; const [x] = a.splice(i, 1); if (x) a.splice(j, 0, x); onChange(a); };
  return (
    <div className="space-y-2">
      {faq.map((q, i) => (
        <div key={i} className="space-y-2 rounded-lg border border-border p-2">
          <div className="flex items-center gap-2">
            <input value={(q.category_es as string) ?? ""} onChange={(e) => upd(i, { category_es: e.target.value })} placeholder="Categoría ES" className={`${fld} flex-1`} />
            <input value={(q.category_en as string) ?? ""} onChange={(e) => upd(i, { category_en: e.target.value })} placeholder="Category EN" className={`${fld} flex-1`} />
            <button type="button" onClick={() => move(i, -1)}><ChevronUp className="h-4 w-4" /></button>
            <button type="button" onClick={() => move(i, 1)}><ChevronDown className="h-4 w-4" /></button>
            <button type="button" onClick={() => onChange(faq.filter((_, k) => k !== i))}><X className="h-4 w-4 text-destructive" /></button>
          </div>
          <div className="grid grid-cols-2 gap-2"><input value={(q.question_es as string) ?? ""} onChange={(e) => upd(i, { question_es: e.target.value })} placeholder="Pregunta ES" className={fld} /><input value={(q.question_en as string) ?? ""} onChange={(e) => upd(i, { question_en: e.target.value })} placeholder="Question EN" className={fld} /></div>
          <div className="grid grid-cols-2 gap-2"><textarea value={(q.answer_es as string) ?? ""} onChange={(e) => upd(i, { answer_es: e.target.value })} placeholder="Respuesta ES" rows={2} className={fld} /><textarea value={(q.answer_en as string) ?? ""} onChange={(e) => upd(i, { answer_en: e.target.value })} placeholder="Answer EN" rows={2} className={fld} /></div>
        </div>))}
      {faq.length < MAX && <button type="button" onClick={() => onChange([...faq, { category_es: "General", category_en: "General", question_es: "", question_en: "", answer_es: "", answer_en: "" }])} className="flex items-center gap-1 text-sm text-foreground"><Plus className="h-4 w-4" /> +</button>}
    </div>
  );
}
