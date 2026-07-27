import { useEffect, useState } from "react";
import { useI18n } from "@shared/i18n";
import { supabase } from "@shared/lib/supabase";
import { ScreenModal } from "@shared/components/ScreenModal";
import type { OnboardingTemplate, OnbResult } from "@hr/domain/onboarding.types";

export function StartOnboardingModal({ templates, onCreate, onClose }: {
  templates: readonly OnboardingTemplate[]; onCreate: (emp: string, tpl: string | null) => Promise<OnbResult>; onClose: () => void;
}) {
  const { t } = useI18n();
  const [emps, setEmps] = useState<{ id: string; full_name: string }[]>([]);
  const [emp, setEmp] = useState("");
  const [tpl, setTpl] = useState("");
  const [err, setErr] = useState("");
  useEffect(() => { void supabase.from("profiles").select("id,full_name").then(({ data }) => setEmps((data as { id: string; full_name: string }[]) ?? [])); }, []);
  async function save() { if (!emp) { setErr(t("requiredFields")); return; } const r = await onCreate(emp, tpl || null); if (r.ok) onClose(); else setErr(r.error); }
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  const lbl = "text-xs font-bold text-muted-foreground";
  return (
    <ScreenModal onClose={onClose}>
      <div className="space-y-3 p-4 md:p-6">
        <h2 className="font-display text-lg font-bold text-foreground">{t("startOnboarding")}</h2>
        <label className="block space-y-1"><span className={lbl}>{t("employee")}</span>
          <select value={emp} onChange={(e) => setEmp(e.target.value)} className={fld}><option value="">—</option>{emps.map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}</select></label>
        <label className="block space-y-1"><span className={lbl}>{t("selectTemplate")}</span>
          <select value={tpl} onChange={(e) => setTpl(e.target.value)} className={fld}><option value="">{t("defaultTemplate")}</option>{templates.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
        {err && <p className="text-sm text-destructive">{err}</p>}
        <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg bg-secondary px-4 py-2 text-sm font-bold">{t("cancel")}</button>
          <button type="button" onClick={() => void save()} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">{t("startOnboarding")}</button></div>
      </div>
    </ScreenModal>
  );
}
