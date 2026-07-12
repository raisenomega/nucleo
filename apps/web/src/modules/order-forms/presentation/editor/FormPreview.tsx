import { useI18n } from "@shared/i18n";
import { FieldPreviewCard } from "@order-forms/presentation/editor/FieldPreviewCard";
import type { EditorField } from "@order-forms/domain/order-form-field.types";

export function FormPreview({ name, description, fields, selectedId, onSelect, onMove, onRemove }: {
  name: string; description: string; fields: EditorField[]; selectedId: string | null;
  onSelect: (id: string) => void; onMove: (id: string, dir: -1 | 1) => void; onRemove: (id: string) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="space-y-3 p-4">
      <div>
        <h2 className="font-display text-lg font-bold text-foreground">{name || t("ofUntitled")}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {fields.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{t("ofDropHint")}</div>
      ) : (
        <div className="space-y-2">
          {fields.map((f) => (
            <FieldPreviewCard key={f.id} field={f} selected={f.id === selectedId} onSelect={() => onSelect(f.id)}
              onUp={() => onMove(f.id, -1)} onDown={() => onMove(f.id, 1)} onRemove={() => onRemove(f.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
