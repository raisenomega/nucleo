import { useState } from "react";
import { useI18n } from "@shared/i18n";
import { useToast } from "@shared/providers/toast-context";
import { ScreenModal } from "@shared/components/ScreenModal";
import { useOnboarding } from "@hr/application/useOnboarding.hook";
import { supabaseOnboardingRepository } from "@hr/infrastructure/supabase-onboarding.repository";
import { OnboardingList } from "@hr/presentation/OnboardingList";
import { OnboardingDetail } from "@hr/presentation/OnboardingDetail";
import { OnboardingTemplatesTable } from "@hr/presentation/OnboardingTemplatesTable";
import { TemplateFormModal } from "@hr/presentation/TemplateFormModal";
import { StartOnboardingModal } from "@hr/presentation/StartOnboardingModal";
import type { OnboardingChecklist, OnboardingTemplate } from "@hr/domain/onboarding.types";

export function StaffOnboarding({ tenantId }: { tenantId: string }) {
  const { t } = useI18n();
  const toast = useToast();
  const m = useOnboarding(supabaseOnboardingRepository);
  const [tab, setTab] = useState<"employees" | "templates">("employees");
  const [detail, setDetail] = useState<OnboardingChecklist | null>(null);
  const [tpl, setTpl] = useState<{ open: boolean; editing?: OnboardingTemplate }>({ open: false });
  const [start, setStart] = useState(false);
  const tc = (x: string) => `px-3 py-2 text-sm font-bold ${tab === x ? "border-b-2 border-foreground text-foreground" : "text-muted-foreground"}`;
  return (
    <div className="space-y-6 p-4 md:p-8">
      <h1 className="font-display text-xl font-bold text-foreground md:text-3xl">{t("onboarding")}</h1>
      <div className="flex gap-2 border-b border-border">
        <button type="button" onClick={() => setTab("employees")} className={tc("employees")}>{t("onboardingChecklist")}</button>
        <button type="button" onClick={() => setTab("templates")} className={tc("templates")}>{t("onboardingTemplate")}</button>
      </div>
      {tab === "employees"
        ? <OnboardingList rows={m.checklists} onOpen={setDetail} onStart={() => setStart(true)} />
        : <OnboardingTemplatesTable rows={m.templates} onEdit={(x) => setTpl({ open: true, editing: x })} onNew={() => setTpl({ open: true })} />}
      {detail && <ScreenModal onClose={() => { setDetail(null); m.refresh(); }}><div className="p-4 md:p-6">
        <OnboardingDetail employeeId={detail.employeeId} employeeName={detail.employeeName} isStaff tenantId={tenantId} onChanged={m.refresh} /></div></ScreenModal>}
      {start && <StartOnboardingModal templates={m.templates}
        onCreate={async (e, tp) => { const r = await supabaseOnboardingRepository.createChecklist(e, tp); if (r.ok) await m.refresh(); else toast.error(r.error); return r; }} onClose={() => setStart(false)} />}
      {tpl.open && <TemplateFormModal initial={tpl.editing}
        onSubmit={(d) => (tpl.editing ? supabaseOnboardingRepository.updateTemplate(tpl.editing.id, d) : supabaseOnboardingRepository.createTemplate(d)).then((r) => { if (r.ok) void m.refresh(); return r; })}
        onClose={() => setTpl({ open: false })} />}
    </div>
  );
}
