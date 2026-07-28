import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import type { AuditEntry } from "@shared/security/domain/security.types";

function Col({ title, obj }: { title: string; obj: Record<string, unknown> | null }) {
  return (
    <div className="flex-1">
      <p className="mb-1 text-xs font-bold uppercase text-muted-foreground">{title}</p>
      <pre className="overflow-x-auto rounded-lg border border-border bg-secondary p-2 text-xs text-foreground">{obj ? JSON.stringify(obj, null, 2) : "—"}</pre>
    </div>
  );
}

export function AuditDiffModal({ entry, onClose }: { entry: AuditEntry; onClose: () => void }) {
  const { t } = useI18n();
  return (
    <ScreenModal onClose={onClose}>
      <div className="space-y-3 p-4">
        <h2 className="font-display font-bold text-foreground">{entry.action} · {entry.entityType ?? "—"}</h2>
        <div className="flex flex-col gap-3 md:flex-row">
          <Col title={t("secOldValues")} obj={entry.oldValues} />
          <Col title={t("secNewValues")} obj={entry.newValues} />
        </div>
      </div>
    </ScreenModal>
  );
}
