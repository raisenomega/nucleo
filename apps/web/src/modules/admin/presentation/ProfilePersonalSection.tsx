import { useI18n } from "@shared/i18n";
import type { TeamMemberDetail } from "@admin/domain/admin.types";

export function ProfilePersonalSection({ member, form, onChange, canEdit }: {
  member: TeamMemberDetail; form: { fullName: string; phone: string; position: string };
  onChange: (k: "fullName" | "phone" | "position", v: string) => void; canEdit: boolean;
}) {
  const { t } = useI18n();
  const field = "w-full rounded-lg border border-border bg-background p-2 text-sm disabled:opacity-60";
  const lbl = "text-xs font-bold text-muted-foreground";
  const row = (label: string, v: string) => (
    <div><dt className="inline text-muted-foreground">{label}: </dt><dd className="inline">{v || "—"}</dd></div>
  );
  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-5">
      <h2 className="font-body font-bold text-foreground">{t("personalInfo")}</h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="space-y-1"><span className={lbl}>{t("contactName")}</span>
          <input value={form.fullName} disabled={!canEdit} onChange={(e) => onChange("fullName", e.target.value)} className={field} /></label>
        <label className="space-y-1"><span className={lbl}>{t("email")}</span>
          <input value={member.email} disabled className={field} /></label>
        <label className="space-y-1"><span className={lbl}>{t("phone")}</span>
          <input value={form.phone} disabled={!canEdit} onChange={(e) => onChange("phone", e.target.value)} className={field} /></label>
        <label className="space-y-1"><span className={lbl}>{t("position")}</span>
          <input value={form.position} disabled={!canEdit} onChange={(e) => onChange("position", e.target.value)} className={field} /></label>
      </div>
      <dl className="space-y-1 text-sm">
        {row(t("status"), member.status)}
        {row(t("approvedDate"), member.approvedAt ? member.approvedAt.slice(0, 10) : "—")}
        {row(t("registeredDate"), member.createdAt.slice(0, 10))}
      </dl>
    </div>
  );
}
