import { useState } from "react";
import { useI18n } from "@shared/i18n";
import { supabaseRecruitmentRepository } from "@hr/infrastructure/supabase-recruitment.repository";
import type { PublicOpening, ApplyData } from "@hr/domain/recruitment.types";

const EMPTY = { fullName: "", email: "", phone: "", address: "", city: "", state: "", zipCode: "", coverLetter: "" };

// Formulario público del candidato (sin login). Solo texto — la subida de CV se difiere (falta signed URL anón).
export function PublicApplyForm({ opening, onDone }: { opening: PublicOpening; onDone: () => void }) {
  const { t } = useI18n();
  const [f, setF] = useState(EMPTY);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof EMPTY, v: string) => setF((p) => ({ ...p, [k]: v }));
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  async function submit() {
    if (!f.fullName.trim() || !f.email.trim()) { setErr(t("requiredFields")); return; }
    setBusy(true);
    const r = await supabaseRecruitmentRepository.apply(opening.openingId, { ...f, customAnswers: answers } as ApplyData);
    setBusy(false);
    if (r.ok) onDone(); else setErr(r.error);
  }
  return (
    <form onSubmit={(e) => { e.preventDefault(); void submit(); }} className="space-y-3">
      <input required value={f.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder={t("fullName")} className={fld} />
      <input required type="email" value={f.email} onChange={(e) => set("email", e.target.value)} placeholder={t("email")} className={fld} />
      <input value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder={t("phone")} className={fld} />
      <input value={f.address} onChange={(e) => set("address", e.target.value)} placeholder={t("address")} className={fld} />
      <div className="grid grid-cols-3 gap-2">
        <input value={f.city} onChange={(e) => set("city", e.target.value)} placeholder={t("city")} className={fld} />
        <input value={f.state} onChange={(e) => set("state", e.target.value)} placeholder={t("stateField")} className={fld} />
        <input value={f.zipCode} onChange={(e) => set("zipCode", e.target.value)} placeholder={t("zipCode")} className={fld} />
      </div>
      <textarea value={f.coverLetter} onChange={(e) => set("coverLetter", e.target.value)} placeholder={t("coverLetter")} rows={3} className={fld} />
      {opening.customQuestions.map((q, i) => (
        <label key={i} className="block space-y-1"><span className="text-xs font-bold text-muted-foreground">{q}</span>
          <input value={answers[q] ?? ""} onChange={(e) => setAnswers((p) => ({ ...p, [q]: e.target.value }))} className={fld} /></label>))}
      {err && <p className="text-sm text-destructive">{err}</p>}
      <button type="submit" disabled={busy} className="w-full rounded-lg bg-primary px-4 py-3 font-bold text-primary-foreground disabled:opacity-50">{t("applyNow")}</button>
    </form>
  );
}
