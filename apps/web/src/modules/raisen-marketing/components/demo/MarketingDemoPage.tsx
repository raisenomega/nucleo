import "@raisen-marketing/styles/marketing.css";
import { useState } from "react";
import { X, ArrowRight, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { useMarketingLang } from "@raisen-marketing/hooks/useMarketingLang";
import { useMarketingAvailability } from "@raisen-marketing/hooks/useMarketingAvailability";
import { useMarketingSlots } from "@raisen-marketing/hooks/useMarketingSlots";
import { submitReservation } from "@raisen-marketing/infrastructure/marketing-booking.repository";
import { DemoCalendar } from "@raisen-marketing/components/demo/DemoCalendar";
import { DemoSlots } from "@raisen-marketing/components/demo/DemoSlots";
import { DemoForm, type DemoFormState } from "@raisen-marketing/components/demo/DemoForm";

const EMPTY: DemoFormState = { name: "", email: "", phone: "", message: "", website: "" };
const CARD = "rounded-xl border border-border bg-card p-6";

// Página pública /demo: agenda una demo. Paso 1 fecha+hora (calendario custom + slots del RPC), paso 2 datos.
// Submit real vía RPC (valida + anti doble-booking + email al Super Admin). Aesthetic landing (rm-root).
export default function MarketingDemoPage() {
  const { lang, toggleLang } = useMarketingLang();
  const es = lang === "es";
  const { config, blocked } = useMarketingAvailability();
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const { slots, loading } = useMarketingSlots(date);
  const setField = (k: keyof DemoFormState, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const book = async () => {
    if (form.website || !date || !time) return;
    setStatus("submitting");
    const r = await submitReservation({ customerName: form.name, customerEmail: form.email, customerPhone: form.phone, message: form.message, reservationDate: date, reservationTime: time, lang });
    if (r.ok) setStatus("success"); else { setErrorMsg(r.message || (es ? "No se pudo agendar." : "Could not book.")); setStatus("error"); }
  };
  return (
    <div className="rm-root min-h-screen bg-background px-4 py-8">
      <header className="mx-auto mb-8 flex max-w-2xl items-center justify-between">
        <a href="/" className="font-display text-lg font-bold text-white">NÚCLEO<span className="text-primary">.</span></a>
        <div className="flex items-center gap-3">
          <button type="button" onClick={toggleLang} className="rounded-lg bg-secondary px-3 py-1.5 text-sm text-foreground">{es ? "EN" : "ES"}</button>
          <a href="/" aria-label="cerrar" className="grid h-8 w-8 place-items-center rounded-full border border-white/20 text-white/70 hover:text-white"><X size={16} /></a>
        </div>
      </header>
      <div className="mx-auto max-w-2xl">
        {status === "success" && config ? (
          <div className={`${CARD} flex flex-col items-center gap-4 text-center`}><CheckCircle size={56} className="text-primary" /><p className="font-display text-2xl font-bold text-foreground">{es ? config.confirmEs : config.confirmEn}</p><a href="/" className="text-sm text-primary hover:underline">{es ? "Volver al inicio" : "Back to home"}</a></div>
        ) : !config ? <div className="py-20 text-center text-white/50">…</div> : step === 1 ? (
          <div className={CARD}>
            <h1 className="font-display text-2xl font-bold text-foreground">{es ? config.titleEs : config.titleEn}</h1>
            <p className="mb-6 text-sm text-muted-foreground">{es ? config.subtitleEs : config.subtitleEn}</p>
            <div className="grid gap-6 md:grid-cols-2">
              <DemoCalendar availableDays={config.availableDays} blocked={blocked} selected={date} onSelect={(d) => { setDate(d); setTime(null); }} />
              <div><p className="mb-2 text-sm font-medium text-foreground">{es ? "Elige una hora" : "Pick a time"}</p><DemoSlots slots={slots} hasDate={!!date} loading={loading} selected={time} onPick={setTime} es={es} /></div>
            </div>
            {date && time && <button type="button" onClick={() => setStep(2)} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground">{es ? "Continuar" : "Continue"} <ArrowRight size={16} /></button>}
          </div>
        ) : (
          <div className={CARD}>
            <button type="button" onClick={() => setStep(1)} className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={14} /> {es ? "Atrás" : "Back"}</button>
            <p className="mb-4 rounded-lg bg-secondary/50 p-3 text-sm text-foreground">📅 {date} · 🕐 {time} · {config.durationMinutes} min</p>
            <DemoForm form={form} setField={setField} lang={lang} />
            {status === "error" && <p className="mt-3 text-sm text-destructive">{errorMsg}</p>}
            <button type="button" onClick={() => void book()} disabled={status === "submitting" || !form.name.trim() || !form.email.trim()} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">{status === "submitting" ? <Loader2 size={16} className="animate-spin" /> : null} {es ? "Confirmar reserva" : "Confirm booking"}</button>
          </div>
        )}
      </div>
    </div>
  );
}
