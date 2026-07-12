import { useNavigate } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import { useToast } from "@shared/providers/toast-context";
import { useSession } from "@shared/providers/SessionProvider";
import { useFormEditorState } from "@order-forms/presentation/editor/useFormEditorState";
import { useOrderFormActions } from "@order-forms/application/useOrderFormActions.hook";
import { supabaseOrderFormsRepository } from "@order-forms/infrastructure/supabase-order-forms.repository";
import { EditorToolbar } from "@order-forms/presentation/editor/EditorToolbar";
import { FieldsPalette } from "@order-forms/presentation/editor/FieldsPalette";
import { FormPreview } from "@order-forms/presentation/editor/FormPreview";
import { FieldSettingsPanel } from "@order-forms/presentation/editor/FieldSettingsPanel";
import type { OrderFormFull } from "@order-forms/domain/order-form.types";

export function FormEditor({ form }: { form: OrderFormFull }) {
  const { t } = useI18n(); const toast = useToast(); const nav = useNavigate(); const { session } = useSession();
  const e = useFormEditorState(form);
  const a = useOrderFormActions(supabaseOrderFormsRepository);
  async function save() {
    if (e.name.trim().length < 3) return toast.error(t("ofErrName"));
    if (e.fields.some((f) => !f.labelEs.trim())) return toast.error(t("ofErrLabel"));
    const r1 = await a.saveForm(form.id, e.name, e.description);
    const r2 = await a.saveFields(session?.tenantId ?? "", form.id, e.fields, e.deletedIds);
    if (r1.ok && r2.ok) { toast.success(t("saved")); e.markSaved(); } else toast.error(t("ofErr"));
  }
  return (
    <div className="flex h-[calc(100vh-1px)] flex-col">
      <EditorToolbar name={e.name} onName={e.setName} dirty={e.dirty} busy={a.busy} onSave={() => void save()} onClose={() => void nav({ to: "/settings/landing/order-forms" })} />
      <div className="grid flex-1 grid-cols-1 overflow-hidden md:grid-cols-4">
        <FieldsPalette onAdd={e.addField} />
        <div className="overflow-y-auto md:col-span-2">
          <FormPreview name={e.name} description={e.description} fields={e.fields} selectedId={e.selectedId} onSelect={e.setSelectedId} onMove={e.moveField} onRemove={e.removeField} />
        </div>
        <FieldSettingsPanel field={e.selected} fields={e.fields} onChange={e.updateField} onRemove={e.removeField} />
      </div>
    </div>
  );
}
