import { Plus, Pencil } from "lucide-react";
import { useI18n } from "@shared/i18n";
import type { OnboardingTemplate } from "@hr/domain/onboarding.types";

export function OnboardingTemplatesTable({ rows, onEdit, onNew }: {
  rows: readonly OnboardingTemplate[]; onEdit: (t: OnboardingTemplate) => void; onNew: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button type="button" onClick={onNew} className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground"><Plus className="h-4 w-4" /> {t("createTemplate")}</button>
      </div>
      {rows.length === 0 ? <p className="text-sm text-muted-foreground">{t("noRecords")}</p> : (
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead><tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th className="p-2">{t("onboardingTemplate")}</th><th className="p-2">{t("position")}</th><th className="p-2">{t("taskCount")}</th>
            <th className="p-2">{t("defaultTemplate")}</th><th className="p-2"></th></tr></thead>
          <tbody>{rows.map((x) => (
            <tr key={x.id} className="border-b border-border">
              <td className="p-2 font-semibold">{x.name}</td><td className="p-2 text-muted-foreground">{x.positionTitle ?? "—"}</td>
              <td className="p-2">{x.tasks.length}</td><td className="p-2">{x.isDefault ? "✓" : "—"}</td>
              <td className="p-2 text-right"><button type="button" onClick={() => onEdit(x)} aria-label={t("edit")} className="text-muted-foreground hover:text-foreground"><Pencil className="h-4 w-4" /></button></td></tr>))}</tbody>
        </table></div>)}
    </div>
  );
}
