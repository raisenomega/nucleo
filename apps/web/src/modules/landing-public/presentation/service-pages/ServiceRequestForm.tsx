import { useState, type ReactNode } from "react";
import { useI18n } from "@shared/i18n";
import { useToast } from "@shared/providers/toast-context";
import { useCreateServiceRequest } from "@landing-public/presentation/service-pages/useServicePage.hook";
import type { SpField, SpRequestForm } from "@landing-public/domain/service-page.types";

const cls = "w-full rounded-lg border border-border bg-background p-2 text-sm";
export function ServiceRequestForm({ slug, form }: { slug: string; form: SpRequestForm }) {
  const { locale } = useI18n(); const en = locale === "en"; const toast = useToast();
  const { busy, submit } = useCreateServiceRequest(slug);
  const [v, setV] = useState<Record<string, unknown>>({}); const [done, setDone] = useState(false);
  const oL = (o: { label_es: string; label_en: string }) => (en ? o.label_en : o.label_es);
  const resolve = (f: SpField, raw: unknown): string =>
    f.kind === "multi_select" ? ((raw as string[]) ?? []).map((x) => oL(f.options?.find((o) => o.value === x) ?? { label_es: x, label_en: x })).join(", ")
      : f.kind === "select" ? oL(f.options?.find((o) => o.value === raw) ?? { label_es: String(raw ?? ""), label_en: String(raw ?? "") })
        : String(raw ?? "");
  async function onSubmit() {
    const bad = form.fields.find((f) => f.required && !String(v[f.name] ?? "").trim());
    if (bad) return toast.error(en ? "Please complete the required fields." : "Completá los campos obligatorios.");
    const contact = ["firstName", "lastName", "phone", "email"];
    const cf = form.fields.filter((f) => !contact.includes(f.name)).map((f) => ({ label: en ? f.label_en : f.label_es, value: resolve(f, v[f.name]) })).filter((d) => d.value.trim());
    const st = form.fields.find((f) => f.name === "serviceType");
    const payload = { firstName: v.firstName, lastName: v.lastName, phone: v.phone, email: v.email,
      serviceType: v.serviceType, serviceTypeLabel: st ? resolve(st, v.serviceType) : "", custom_fields: cf };
    if (await submit(payload)) setDone(true); else toast.error(en ? "Could not send the request." : "No se pudo enviar la solicitud.");
  }
  const field = (f: SpField): ReactNode => {
    const val = v[f.name]; const set = (x: unknown) => setV((p) => ({ ...p, [f.name]: x }));
    if (f.kind === "select") return <select value={(val as string) ?? ""} onChange={(e) => set(e.target.value)} className={cls}><option value="">—</option>{f.options?.map((o) => <option key={o.value} value={o.value}>{oL(o)}</option>)}</select>;
    if (f.kind === "multi_select") return <div className="flex flex-wrap gap-3">{f.options?.map((o) => { const arr = (val as string[]) ?? []; const on = arr.includes(o.value); return <label key={o.value} className="flex items-center gap-1 text-sm"><input type="checkbox" checked={on} onChange={() => set(on ? arr.filter((x) => x !== o.value) : [...arr, o.value])} />{oL(o)}</label>; })}</div>;
    if (f.kind === "textarea") return <textarea value={(val as string) ?? ""} placeholder={en ? f.placeholder_en : f.placeholder_es} onChange={(e) => set(e.target.value)} rows={3} className={cls} />;
    return <input type={f.kind === "email" ? "email" : f.kind === "tel" ? "tel" : "text"} value={(val as string) ?? ""} onChange={(e) => set(e.target.value)} className={cls} />;
  };
  if (done) return <section id="solicitar" className="mx-auto max-w-2xl px-6 py-16 text-center"><h2 className="text-2xl font-bold text-foreground">{en ? form.success_title_en : form.success_title_es}</h2><p className="mt-2 text-[color:hsl(var(--lp-muted))]">{en ? form.success_message_en : form.success_message_es}</p></section>;
  return (
    <section id="solicitar" className="mx-auto max-w-2xl px-6 py-12">
      <h2 style={{ fontSize: "var(--text-h2)" }} className="mb-6 text-center font-bold">{en ? form.title_en : form.title_es}</h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {form.fields.map((f) => (
          <label key={f.name} className={f.kind === "textarea" || f.kind === "multi_select" ? "block md:col-span-2" : "block"}>
            <span className="mb-1 block text-sm font-medium text-foreground">{(en ? f.label_en : f.label_es)}{f.required ? " *" : ""}</span>{field(f)}
          </label>))}
      </div>
      <button type="button" disabled={busy} onClick={() => void onSubmit()} className="mt-4 w-full rounded-lg bg-primary px-4 py-3 font-bold text-primary-foreground disabled:opacity-50">{en ? form.submit_label_en : form.submit_label_es}</button>
    </section>
  );
}
