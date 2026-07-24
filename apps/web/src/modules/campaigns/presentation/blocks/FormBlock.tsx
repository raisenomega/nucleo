import { useState } from "react";
import type { FormEvent } from "react";
import { track } from "@shared/analytics/track";
import { createCampaignLead } from "@campaigns/infrastructure/campaigns-public.repository";
import { captureAttribution } from "@campaigns/infrastructure/campaign-attribution";
import type { BlockContent } from "@campaigns/domain/campaign.types";

const s = (c: BlockContent, k: string) => (typeof c[k] === "string" ? (c[k] as string) : "");
type Custom = { name: string; label?: string; required?: boolean };

// Bloque Formulario (R2): campos configurables + honeypot invisible + captura de atribución + estados idle/enviando/ok/error.
export function FormBlock({ content, pageId }: { content: BlockContent; pageId: string }) {
  const raw = content.fields;
  const fields = Array.isArray(raw) ? (raw as string[]) : typeof raw === "string" ? raw.split(",").map((x) => x.trim()).filter(Boolean) : ["name", "email"];
  const custom = (Array.isArray(content.custom_fields) ? content.custom_fields : []) as Custom[];
  const [v, setV] = useState<Record<string, string>>({});
  const [hp, setHp] = useState("");
  const [st, setSt] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const set = (k: string, val: string) => setV((p) => ({ ...p, [k]: val }));
  async function submit(e: FormEvent) {
    e.preventDefault(); setSt("sending");
    const cf = [...custom.map((f) => ({ label: f.label ?? f.name, value: v[`c_${f.name}`] ?? "" })), ...(v.company ? [{ label: "Empresa", value: v.company }] : [])].filter((x) => x.value);
    const r = await createCampaignLead(window.location.host, {
      page_id: pageId, customer_name: v.name ?? "", customer_email: v.email ?? "", customer_phone: v.phone ?? "",
      message: v.message ?? "", hp, custom_fields: cf, attribution: captureAttribution(),
    });
    if (r.ok) { track("form_contact_submitted"); setSt("ok"); const url = s(content, "redirect_url"); if (url) window.setTimeout(() => { window.location.href = url; }, 2000); } else setSt("error");
  }
  if (st === "ok") return <section className="camp-form" id="form"><p className="camp-form-ok">{s(content, "success_message") || "¡Gracias! Te contactaremos pronto."}</p></section>;
  return (
    <section className="camp-form" id="form">
      {s(content, "title") && <h2 className="camp-form-title">{s(content, "title")}</h2>}
      {s(content, "subtitle") && <p className="camp-form-sub">{s(content, "subtitle")}</p>}
      <form onSubmit={submit} className="camp-form-body">
        {fields.includes("name") && <input className="camp-input" placeholder="Nombre" value={v.name ?? ""} onChange={(e) => set("name", e.target.value)} required />}
        <input className="camp-input" type="email" placeholder="Email" value={v.email ?? ""} onChange={(e) => set("email", e.target.value)} required />
        {fields.includes("phone") && <input className="camp-input" placeholder="Teléfono" value={v.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />}
        {fields.includes("company") && <input className="camp-input" placeholder="Empresa" value={v.company ?? ""} onChange={(e) => set("company", e.target.value)} />}
        {fields.includes("message") && <textarea className="camp-input" placeholder="Mensaje" value={v.message ?? ""} onChange={(e) => set("message", e.target.value)} />}
        {custom.map((f) => <input key={f.name} className="camp-input" placeholder={f.label ?? f.name} required={f.required} value={v[`c_${f.name}`] ?? ""} onChange={(e) => set(`c_${f.name}`, e.target.value)} />)}
        <input tabIndex={-1} autoComplete="off" aria-hidden="true" className="camp-hp" value={hp} onChange={(e) => setHp(e.target.value)} />
        <button type="submit" className="camp-btn" disabled={st === "sending"}>{st === "sending" ? "Enviando…" : s(content, "cta_label") || "Enviar"}</button>
        {st === "error" && <p className="camp-form-err">No se pudo enviar. Revisá los datos e intentá de nuevo.</p>}
        {s(content, "consent_text") && <p className="camp-consent">{s(content, "consent_text")}</p>}
      </form>
    </section>
  );
}
