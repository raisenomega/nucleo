import { COPY, type Lang } from "@raisen-marketing/data/copy";

export interface DemoFormState { name: string; email: string; phone: string; message: string; website: string }
const INPUT = "flex w-full rounded-md border border-input bg-secondary/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

// Datos del visitante para la reserva (name/email/phone/message) + honeypot oculto. Controlado por el padre.
export function DemoForm({ form, setField, lang }: { form: DemoFormState; setField: (k: keyof DemoFormState, v: string) => void; lang: Lang }) {
  const c = COPY[lang];
  return (
    <div className="space-y-3">
      <input className={INPUT} placeholder={c.fName} value={form.name} onChange={(e) => setField("name", e.target.value)} />
      <input className={INPUT} type="email" placeholder={c.fEmail} value={form.email} onChange={(e) => setField("email", e.target.value)} />
      <input className={INPUT} placeholder={c.fPhone} value={form.phone} onChange={(e) => setField("phone", e.target.value)} />
      <textarea className={`${INPUT} resize-none`} rows={3} placeholder={c.fMessage} value={form.message} onChange={(e) => setField("message", e.target.value)} />
      <input type="text" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" value={form.website} onChange={(e) => setField("website", e.target.value)} />
    </div>
  );
}
