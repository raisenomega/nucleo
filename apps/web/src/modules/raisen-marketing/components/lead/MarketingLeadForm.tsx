import { useState, type ChangeEvent, type FormEvent } from "react";
import { z } from "zod";
import { Send, CheckCircle } from "lucide-react";
import { useScrollReveal } from "@raisen-marketing/hooks/useScrollReveal";
import { COPY, type Lang } from "@raisen-marketing/data/copy";
import type { Audience } from "@raisen-marketing/data/solutions";

const schema = z.object({ name: z.string().min(2), email: z.string().email() });
const INPUT = "flex w-full rounded-md border border-input bg-secondary/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

// Réplica del LeadFormSection de OMEGA (campos name/email/phone/message + honeypot + 2 pills de audience).
// S2.6: submit mockado (setTimeout → success); la DB + POST real vienen en S3. Validación Zod.
export function MarketingLeadForm({ lang, audience, setAudience }: { lang: Lang; audience: Audience; setAudience: (a: Audience) => void }) {
  const c = COPY[lang];
  const { ref, isVisible } = useScrollReveal();
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "", website: "" });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const set = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (form.website) return; // honeypot
    if (!schema.safeParse(form).success) return setStatus("error");
    setStatus("submitting");
    setTimeout(() => setStatus("success"), 1000);
  };
  if (status === "success") return (
    <section id="lead-form" className="px-6 py-16 md:py-20">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 rounded-lg border border-primary/30 bg-card p-12 text-center">
        <CheckCircle size={48} className="text-primary" /><p className="text-lg font-medium text-foreground">{c.leadSuccess}</p>
      </div>
    </section>
  );
  return (
    <section id="lead-form" ref={ref} className={`px-6 py-16 transition-all duration-700 md:py-20 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
      <div className="mx-auto max-w-2xl">
        <div className="mb-10 text-center">
          <h2 className="mb-4 font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">{c.leadTitle}</h2>
          <p className="text-muted-foreground">{c.leadSubtitle}</p>
        </div>
        <div className="mb-6 flex gap-3">
          {(["business", "partner"] as Audience[]).map((a) => (
            <button key={a} type="button" onClick={() => setAudience(a)} className={`flex-1 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${audience === a ? "border-primary bg-primary/10 text-primary" : "border-input text-muted-foreground hover:text-foreground"}`}>{a === "business" ? c.pillBusiness : c.pillPartner}</button>
          ))}
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <input className={INPUT} placeholder={c.fName} value={form.name} onChange={set("name")} />
          <input className={INPUT} type="email" placeholder={c.fEmail} value={form.email} onChange={set("email")} />
          <input className={INPUT} placeholder={c.fPhone} value={form.phone} onChange={set("phone")} />
          <textarea className={`${INPUT} resize-none`} rows={4} placeholder={c.fMessage} value={form.message} onChange={set("message")} />
          <input type="text" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" value={form.website} onChange={set("website")} />
          {status === "error" && <p className="text-sm text-destructive">{c.leadError}</p>}
          <button type="submit" disabled={status === "submitting"} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-8 py-3 font-display text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-50">
            <Send size={16} /> {status === "submitting" ? c.leadSending : c.leadCta}
          </button>
          <p className="text-center text-xs text-muted-foreground">{c.leadConsent}</p>
        </form>
      </div>
    </section>
  );
}
