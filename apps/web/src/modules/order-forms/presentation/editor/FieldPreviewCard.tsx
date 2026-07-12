import { ChevronUp, ChevronDown, X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { KIND_LABEL } from "@order-forms/domain/field-kind.types";
import { KIND_ICON } from "@order-forms/presentation/kind-icon.const";
import type { EditorField } from "@order-forms/domain/order-form-field.types";

export function FieldPreviewCard({ field, selected, onSelect, onUp, onDown, onRemove }: {
  field: EditorField; selected: boolean; onSelect: () => void; onUp: () => void; onDown: () => void; onRemove: () => void;
}) {
  const { t, locale } = useI18n();
  const Icon = KIND_ICON[field.kind];
  const label = (locale === "en" ? field.labelEn : field.labelEs) || t(KIND_LABEL[field.kind]);
  const btn = (fn: () => void, node: React.ReactNode, lbl: string) => (
    <button type="button" aria-label={lbl} onClick={(e) => { e.stopPropagation(); fn(); }} className="rounded p-1 text-muted-foreground hover:bg-secondary">{node}</button>
  );
  return (
    <div onClick={onSelect} className={`cursor-pointer rounded-lg border p-3 ${selected ? "border-primary ring-1 ring-primary" : "border-border hover:border-muted-foreground"}`}>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="flex-1 truncate text-sm font-medium text-foreground">{label}{field.required && <span className="text-destructive"> *</span>}</span>
        {btn(onUp, <ChevronUp className="h-4 w-4" />, "up")}{btn(onDown, <ChevronDown className="h-4 w-4" />, "down")}
        {btn(onRemove, <X className="h-4 w-4 text-destructive" />, "remove")}
      </div>
      {field.conditionalOn && <p className="mt-1 pl-6 text-xs text-muted-foreground">{t("ofCondBadge")}</p>}
    </div>
  );
}
