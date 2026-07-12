import { useI18n } from "@shared/i18n";
import { BASIC_KINDS, ADVANCED_KINDS, KIND_LABEL, type FieldKind } from "@order-forms/domain/field-kind.types";
import { KIND_ICON } from "@order-forms/presentation/kind-icon.const";

export function FieldsPalette({ onAdd }: { onAdd: (k: FieldKind) => void }) {
  const { t } = useI18n();
  const item = (k: FieldKind, disabled: boolean) => {
    const Icon = KIND_ICON[k];
    return (
      <button key={k} type="button" disabled={disabled} onClick={() => onAdd(k)}
        className={`flex w-full items-center gap-2 rounded-lg border border-border p-2 text-left text-sm ${disabled ? "cursor-not-allowed opacity-40" : "text-foreground hover:bg-secondary"}`}>
        <Icon className="h-4 w-4 shrink-0" /><span className="truncate">{t(KIND_LABEL[k])}</span>
        {disabled && <span className="ml-auto shrink-0 text-[10px] uppercase text-muted-foreground">{t("ofSoon")}</span>}
      </button>
    );
  };
  return (
    <aside className="space-y-4 overflow-y-auto border-r border-border p-3">
      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">{t("ofBasic")}</h3>
        <div className="space-y-1">{BASIC_KINDS.map((k) => item(k, false))}</div>
      </div>
      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">{t("ofAdvanced")}</h3>
        <div className="space-y-1">{ADVANCED_KINDS.map((k) => item(k, true))}</div>
      </div>
    </aside>
  );
}
