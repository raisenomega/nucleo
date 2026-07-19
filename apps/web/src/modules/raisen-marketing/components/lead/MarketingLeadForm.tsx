import { useState } from "react";
import { z } from "zod";
import { CheckCircle, Loader2 } from "lucide-react";
import { COPY, type Lang } from "@raisen-marketing/data/copy";

const schema = z.object({ name: z.string().min(1), email: z.string().email() });
const FIELD = "w-full rounded-md border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500";

// Lead form (S2: submit mockado, la DB viene en S3). Controlado con useState + validación Zod. Pills business/partner.
export function MarketingLeadForm({ lang }: { lang: Lang }) {
  const c = COPY[lang];
  const [kind, setKind] = useState<"business" | "partner">("business");
  const [f, setF] = useState({ name: "", email: "", phone: "", businessType: "", message: "" });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const pill = (active: boolean) => `rounded-full border px-4 py-2 text-sm transition-colors ${active ? "border-violet-500 bg-violet-500/10 text-violet-400" : "border-white/10 text-white/40 hover:text-white"}`;
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schema.safeParse(f).success) return setStatus("error");
    setStatus("submitting");
    setTimeout(() => setStatus("success"), 1000);
  };
  if (status === "success") return (
    <section id="lead-form" className="px-6 py-32"><div className="mx-auto max-w-2xl text-center">
      <CheckCircle className="mx-auto h-12 w-12 text-emerald-400" /><p className="mt-4 text-lg text-white/80">{c.leadSuccess}</p>
    </div></section>
  );
  return (
    <section id="lead-form" className="px-6 py-32"><div className="mx-auto max-w-2xl text-center">
      <h2 className="text-4xl font-bold text-white md:text-5xl">{c.leadTitle}</h2>
      <p className="mt-4 text-white/60">{c.leadSubtitle}</p>
      <div className="mt-8 flex justify-center gap-3">
        <button type="button" onClick={() => setKind("business")} className={pill(kind === "business")}>{c.pillBusiness}</button>
        <button type="button" onClick={() => setKind("partner")} className={pill(kind === "partner")}>{c.pillPartner}</button>
      </div>
      <form onSubmit={submit} className="mt-8 space-y-4 text-left">
        <input className={FIELD} placeholder={c.fName} value={f.name} onChange={set("name")} />
        <input className={FIELD} type="email" placeholder={c.fEmail} value={f.email} onChange={set("email")} />
        <input className={FIELD} placeholder={c.fPhone} value={f.phone} onChange={set("phone")} />
        <select className={FIELD} value={f.businessType} onChange={set("businessType")}>
          <option value="">{c.fBusinessType}</option>
          {c.businessTypes.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <textarea className={FIELD} rows={4} placeholder={c.fMessage} value={f.message} onChange={set("message")} />
        {status === "error" && <p className="text-sm text-red-400">{c.leadError}</p>}
        <button type="submit" disabled={status === "submitting"}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-violet-500 px-8 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.02] disabled:opacity-50">
          {status === "submitting" ? <><Loader2 className="h-4 w-4 animate-spin" />{c.leadSending}</> : c.leadCta}
        </button>
        <p className="text-xs text-white/30">{c.leadConsent}</p>
      </form>
    </div></section>
  );
}
