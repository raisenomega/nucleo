import { useI18n } from "@shared/i18n";
import type { OrderFormSummary } from "@order-forms/domain/order-form.types";

export function OrderFormRow({ form, onEdit, onDuplicate, onDefault, onDelete }: {
  form: OrderFormSummary; onEdit: () => void; onDuplicate: () => void; onDefault: () => void; onDelete: () => void;
}) {
  const { t } = useI18n();
  const act = "text-sm text-foreground hover:underline";
  return (
    <tr className="border-t border-border">
      <td className="p-3">
        <button type="button" onClick={onEdit} className="text-left font-medium text-foreground hover:underline">{form.name}</button>
        {form.isDefault && <span className="ml-2 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-bold text-primary">{t("ofDefault")}</span>}
        {form.description && <div className="text-xs text-muted-foreground">{form.description}</div>}
      </td>
      <td className="p-3 text-sm text-muted-foreground">{t("ofFieldCount", { n: form.fieldCount })}</td>
      <td className="p-3 text-xs text-muted-foreground">{new Date(form.createdAt).toLocaleDateString()}</td>
      <td className="p-3">
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={onEdit} className={act}>{t("edit")}</button>
          <button type="button" onClick={onDuplicate} className={act}>{t("ofDuplicate")}</button>
          {!form.isDefault && <button type="button" onClick={onDefault} className={act}>{t("ofMakeDefault")}</button>}
          <button type="button" onClick={onDelete} className="text-sm text-destructive hover:underline">{t("delete")}</button>
        </div>
      </td>
    </tr>
  );
}
