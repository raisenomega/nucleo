import { useState } from "react";
import { useToast } from "@shared/providers/toast-context";
import { saveLeadFormConfig } from "@raisen-marketing/infrastructure/marketing-lead-form.repository";
import type { LeadFormConfig } from "@raisen-marketing/data/lead-form.types";

const F = "w-full rounded-lg border border-border bg-background p-2 text-sm text-foreground";
// Pares [claveES, claveEN, label] — cada texto del form es editable en ES/EN.
const ROWS: [keyof LeadFormConfig, keyof LeadFormConfig, string][] = [
  ["titleEs", "titleEn", "Título"], ["subtitleEs", "subtitleEn", "Subtítulo"],
  ["pillBusinessEs", "pillBusinessEn", "Pill negocio"], ["pillPartnerEs", "pillPartnerEn", "Pill partner"],
  ["ctaLabelEs", "ctaLabelEn", "Botón CTA"], ["successEs", "successEn", "Mensaje éxito"],
  ["errorEs", "errorEn", "Mensaje error"], ["consentEs", "consentEn", "Consentimiento"],
  ["companyLabelEs", "companyLabelEn", "Label Empresa"],
  ["confSubjectEs", "confSubjectEn", "Email confirmación · asunto"], ["confBodyEs", "confBodyEn", "Email confirmación · cuerpo"],
];

// Editor de los textos del formulario comercial (todos ES/EN). Guarda la config; la landing la refleja.
export function LeadFormConfigEditor({ config }: { config: LeadFormConfig }) {
  const toast = useToast();
  const [c, setC] = useState(config);
  const set = (k: keyof LeadFormConfig, v: string) => setC((x) => ({ ...x, [k]: v }));
  const save = async () => { const e = await saveLeadFormConfig(c); if (e) toast.error(e); else toast.success("Config guardada"); };
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <h2 className="font-display text-lg font-bold text-foreground">Textos del formulario</h2>
      {ROWS.map(([es, en, label]) => (
        <div key={es} className="grid grid-cols-2 gap-2">
          <input className={F} placeholder={`${label} ES`} value={c[es] as string} onChange={(e) => set(es, e.target.value)} />
          <input className={F} placeholder={`${label} EN`} value={c[en] as string} onChange={(e) => set(en, e.target.value)} />
        </div>
      ))}
      <button type="button" onClick={() => void save()} className="rounded-lg bg-primary px-5 py-2 text-sm font-bold text-primary-foreground">Guardar config</button>
    </div>
  );
}
