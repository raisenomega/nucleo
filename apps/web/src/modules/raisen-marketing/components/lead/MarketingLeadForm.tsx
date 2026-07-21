import { useState, type ChangeEvent, type FormEvent } from "react";
import { z } from "zod";
import { Send, CheckCircle, Loader2 } from "lucide-react";
import { useScrollReveal } from "@raisen-marketing/hooks/useScrollReveal";
import { useMarketingLeadForm } from "@raisen-marketing/hooks/useMarketingLeadForm";
import { submitLead } from "@raisen-marketing/infrastructure/marketing-lead-form.repository";
import { LEAD_FORM_FALLBACK } from "@raisen-marketing/data/lead-form-fallback";
import { COPY, type Lang } from "@raisen-marketing/data/copy";
import type { Audience } from "@raisen-marketing/data/solutions";

const schema = z.object({ name: z.string().min(2), email: z.string().email() });
const INPUT = "flex w-full rounded-md border border-input bg-secondary/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

// LeadForm comercial: textos desde DB (config editable), submit REAL vía RPC _marketing_create_lead (valida +
// rate-limit + email al Super Admin). Honeypot + pills (pill_preset de Solutions pre-marca audience). UTM en el repo.
export function MarketingLeadForm({ lang, audience, setAudience }: { lang: Lang; audience: Audience; setAudience: (a: Audience) => void }) {
  const es = lang === "es";
  const c = useMarketingLeadForm() ?? LEAD_FORM_FALLBACK;
  const { ref, isVisible } = useScrollReveal();
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", message: "", website: "" });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const set = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (form.website) return; // honeypot
    if (!schema.safeParse(form).success) { setErrorMsg(es ? c.errorEs : c.errorEn); return setStatus("error"); }
    setStatus("submitting");
    const r = await submitLead({ customerName: form.name, customerEmail: form.email, customerPhone: form.phone, company: form.company, message: form.message, leadType: audience, lang });
    if (r.ok) setStatus("success");
    else { setErrorMsg(r.message || (es ? c.errorEs : c.errorEn)); setStatus("error"); }
  };
  if (status === "success") return (
    <section id="lead-form" aria-label={es ? "Solicitud enviada" : "Request sent"} className="px-6 py-16 md:py-20">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 rounded-lg border border-primary/30 bg-card p-12 text-center">
        <CheckCircle size={48} className="text-primary" /><p className="text-lg font-medium text-foreground">{es ? c.successEs : c.successEn}</p>
      </div>
    </section>
  );
  return (
    <section id="lead-form" aria-labelledby="lead-form-title" ref={ref} className={`px-6 py-16 transition-all duration-700 md:py-20 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
      <div className="mx-auto max-w-2xl">
        <div className="mb-10 text-center">
          <h2 id="lead-form-title" className="mb-4 font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">{es ? c.titleEs : c.titleEn}</h2>
          <p className="text-muted-foreground">{es ? c.subtitleEs : c.subtitleEn}</p>
        </div>
        <div className="mb-6 flex gap-3">
          {(["business", "partner"] as Audience[]).map((a) => (
            <button key={a} type="button" onClick={() => setAudience(a)} className={`flex-1 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${audience === a ? "border-primary bg-primary/10 text-primary" : "border-input text-muted-foreground hover:text-foreground"}`}>{a === "business" ? (es ? c.pillBusinessEs : c.pillBusinessEn) : (es ? c.pillPartnerEs : c.pillPartnerEn)}</button>
          ))}
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <input className={INPUT} placeholder={COPY[lang].fName} value={form.name} onChange={set("name")} />
          <input className={INPUT} type="email" placeholder={COPY[lang].fEmail} value={form.email} onChange={set("email")} />
          <input className={INPUT} placeholder={COPY[lang].fPhone} value={form.phone} onChange={set("phone")} />
          <input className={INPUT} placeholder={es ? c.companyLabelEs : c.companyLabelEn} value={form.company} onChange={set("company")} />
          <textarea className={`${INPUT} resize-none`} rows={4} placeholder={COPY[lang].fMessage} value={form.message} onChange={set("message")} />
          <input type="text" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" value={form.website} onChange={set("website")} />
          {status === "error" && <p className="text-sm text-destructive">{errorMsg}</p>}
          <button type="submit" disabled={status === "submitting"} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-8 py-3 font-display text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-50">
            {status === "submitting" ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} {es ? c.ctaLabelEs : c.ctaLabelEn}
          </button>
          <p className="text-center text-xs text-muted-foreground">{es ? c.consentEs : c.consentEn}</p>
        </form>
      </div>
    </section>
  );
}
